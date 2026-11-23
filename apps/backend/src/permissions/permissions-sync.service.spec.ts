import { Test, TestingModule } from '@nestjs/testing';
import {
  PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  STAFF_ROLES,
} from '@futora/types';
import { PermissionsSyncService } from './permissions-sync.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PermissionsSyncService', () => {
  let service: PermissionsSyncService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      permission: {
        findMany: jest.fn(),
        upsert: jest.fn(),
      },
      role: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      rolePermission: {
        createMany: jest.fn(),
      },
      restaurant: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsSyncService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<PermissionsSyncService>(PermissionsSyncService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should upsert all canonical permissions and backfill missing roles/permissions', async () => {
    const allPerms = PERMISSIONS.map((p, idx) => ({
      id: `perm-${idx}`,
      key: p.key,
      label: p.label,
      category: p.category,
    }));

    // 1. Initial state: DB has empty permissions
    prisma.permission.findMany
      .mockResolvedValueOnce([]) // known before sync
      .mockResolvedValueOnce(allPerms); // allPermissions after upsert

    prisma.permission.upsert.mockImplementation(async (args: any) => ({
      id: `id-${args.where.key}`,
      ...args.create,
    }));

    prisma.role.findMany.mockImplementation(async (args: any) => {
      if (args?.where?.name?.in) {
        // Query for ALWAYS_FULL_ACCESS_ROLES or GRANT_WHEN_CREATED
        return args.where.name.in.map((name: string) => ({
          id: `role-${name}`,
          name,
          permissions: [],
        }));
      }
      if (args?.select?.restaurantId) {
        // allRoles query: only OWNER exists for rest-1
        return [{ restaurantId: 'rest-1', name: 'OWNER' }];
      }
      return [];
    });

    prisma.restaurant.findMany.mockResolvedValue([{ id: 'rest-1' }]);

    prisma.role.create.mockImplementation(async (args: any) => ({
      id: `new-role-${args.data.name}`,
      ...args.data,
    }));

    prisma.rolePermission.createMany.mockResolvedValue({ count: 1 });

    await service.sync();

    // Verify upsert was called for all canonical permissions
    expect(prisma.permission.upsert).toHaveBeenCalledTimes(PERMISSIONS.length);

    // Verify missing roles were created (rest-1 was missing CAPTAIN, CASHIER, etc.)
    expect(prisma.role.create).toHaveBeenCalled();
    const createdRoleNames = prisma.role.create.mock.calls.map(
      (call: any) => call[0].data.name,
    );
    expect(createdRoleNames).toContain('CAPTAIN');

    // Verify role permissions were created
    expect(prisma.rolePermission.createMany).toHaveBeenCalled();
  });

  it('should be idempotent when all permissions and roles already exist', async () => {
    const existingPerms = PERMISSIONS.map((p, idx) => ({
      id: `perm-${idx}`,
      key: p.key,
      label: p.label,
      category: p.category,
    }));

    prisma.permission.findMany
      .mockResolvedValueOnce(existingPerms) // known before sync (all known)
      .mockResolvedValueOnce(existingPerms); // allPermissions after upsert

    prisma.permission.upsert.mockImplementation(async (args: any) => ({
      id: `id-${args.where.key}`,
      ...args.create,
    }));

    // All roles already exist for rest-1
    const allExistingRoles = STAFF_ROLES.map((roleName) => ({
      restaurantId: 'rest-1',
      name: roleName,
    }));

    prisma.role.findMany.mockImplementation(async (args: any) => {
      if (args?.select?.restaurantId) {
        return allExistingRoles;
      }
      if (args?.where?.name?.in) {
        return args.where.name.in.map((name: string) => ({
          id: `role-${name}`,
          name,
          permissions: existingPerms.map((p) => ({ permissionId: p.id })),
        }));
      }
      return [];
    });

    prisma.restaurant.findMany.mockResolvedValue([{ id: 'rest-1' }]);

    prisma.role.create.mockImplementation(async (args: any) => ({
      id: `new-role-${args.data.name}`,
      ...args.data,
    }));

    prisma.rolePermission.createMany.mockResolvedValue({ count: 0 });

    await service.sync();

    // No new roles should be created
    expect(prisma.role.create).not.toHaveBeenCalled();
    // No backfill needed for OWNER/ADMINISTRATOR since all permissions are already granted
    expect(prisma.rolePermission.createMany).not.toHaveBeenCalled();
  });
});
