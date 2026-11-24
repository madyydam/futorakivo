import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  permissionSatisfied,
  type CreateStaffDto,
  type DepartmentDto,
  type SessionUser,
  type SetPermissionOverridesDto,
  type UpdateStaffDto,
} from '@futora/types';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PermissionsCacheService } from '../../permissions/permissions-cache.service';

const SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  isActive: true,
  createdAt: true,
  roleId: true,
  role: { select: { id: true, name: true, label: true } },
  departmentId: true,
  department: { select: { id: true, name: true } },
  permissionOverrides: {
    select: {
      effect: true,
      reason: true,
      expiresAt: true,
      permission: { select: { key: true } },
    },
  },
  branches: { select: { branch: { select: { id: true, name: true } } } },
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Optional() private readonly cache?: PermissionsCacheService,
  ) {}

  list(restaurantId: string) {
    return this.prisma.user.findMany({
      where: { restaurantId },
      select: SELECT,
      orderBy: { createdAt: 'asc' },
    });
  }

  listRoles(restaurantId: string) {
    return this.prisma.role.findMany({
      where: { restaurantId },
      orderBy: { label: 'asc' },
    });
  }

  async create(restaurantId: string, actor: SessionUser, dto: CreateStaffDto) {
    const targetRole = await this.assertRoleInRestaurant(
      restaurantId,
      dto.roleId,
    );
    this.assertRoleAssignableByActor(actor, targetRole);
    const uniqueBranchIds = [...new Set(dto.branchIds)];
    await this.assertBranchesInRestaurant(restaurantId, uniqueBranchIds);
    await this.assertDepartmentInRestaurant(restaurantId, dto.departmentId);

    const normalizedEmail = dto.email ? dto.email.trim().toLowerCase() : undefined;
    if (normalizedEmail) {
      const existing = await this.prisma.user.findFirst({
        where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException(
          'A staff account with this email already exists',
        );
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        restaurantId,
        name: dto.name,
        email: normalizedEmail,
        phone: dto.phone,
        roleId: dto.roleId,
        departmentId: dto.departmentId ?? undefined,
        passwordHash,
        branches: {
          create: uniqueBranchIds.map((branchId) => ({ branchId })),
        },
      },
      select: SELECT,
    });

    await this.audit.record({
      userId: actor.id,
      action: 'staff.created',
      entity: 'User',
      entityId: user.id,
      metadata: { name: user.name, email: user.email, roleId: user.roleId },
    });

    return user;
  }

  async update(
    restaurantId: string,
    actor: SessionUser,
    id: string,
    dto: UpdateStaffDto,
  ) {
    const existing = await this.prisma.user.findFirst({
      where: { id, restaurantId },
      include: {
        role: {
          include: {
            permissions: { include: { permission: { select: { key: true } } } },
          },
        },
      },
    });
    if (!existing) {
      throw new NotFoundException('Staff account not found');
    }

    this.assertRoleAssignableByActor(actor, existing.role);

    if (id === actor.id) {
      if (dto.roleId && dto.roleId !== existing.roleId) {
        throw new BadRequestException('You cannot change your own role');
      }
      if (dto.isActive === false) {
        throw new BadRequestException('You cannot deactivate your own account');
      }
    }

    if (
      (dto.isActive === false || dto.roleId) &&
      existing.role.name === 'OWNER'
    ) {
      const otherActiveOwners = await this.prisma.user.count({
        where: {
          restaurantId,
          isActive: true,
          id: { not: id },
          role: { name: 'OWNER' },
        },
      });
      if (otherActiveOwners === 0) {
        throw new BadRequestException(
          'Cannot disable or change the role of the last active owner',
        );
      }
    }

    if (dto.roleId) {
      const nextRole = await this.assertRoleInRestaurant(
        restaurantId,
        dto.roleId,
      );
      this.assertRoleAssignableByActor(actor, nextRole);
    }

    const normalizedEmail =
      dto.email !== undefined ? dto.email.trim().toLowerCase() : undefined;
    if (normalizedEmail) {
      const emailConflict = await this.prisma.user.findFirst({
        where: {
          email: { equals: normalizedEmail, mode: 'insensitive' },
          id: { not: id },
        },
        select: { id: true },
      });
      if (emailConflict) {
        throw new ConflictException(
          'A staff account with this email already exists',
        );
      }
    }

    const uniqueBranchIds = dto.branchIds
      ? [...new Set(dto.branchIds)]
      : undefined;
    if (uniqueBranchIds) {
      await this.assertBranchesInRestaurant(restaurantId, uniqueBranchIds);
    }
    await this.assertDepartmentInRestaurant(restaurantId, dto.departmentId);

    const passwordHash = dto.password
      ? await bcrypt.hash(dto.password, 12)
      : undefined;

    const securityOrScopeChanged =
      (dto.roleId !== undefined && dto.roleId !== existing.roleId) ||
      (dto.isActive !== undefined && dto.isActive !== existing.isActive) ||
      Boolean(dto.password) ||
      Boolean(uniqueBranchIds);

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        email: normalizedEmail,
        phone: dto.phone,
        roleId: dto.roleId,
        departmentId: dto.departmentId,
        isActive: dto.isActive,
        passwordHash,
        ...(securityOrScopeChanged
          ? { permissionsVersion: { increment: 1 } }
          : {}),
        ...(uniqueBranchIds
          ? {
              branches: {
                deleteMany: {},
                create: uniqueBranchIds.map((branchId) => ({ branchId })),
              },
            }
          : {}),
      },
      select: SELECT,
    });

    if (securityOrScopeChanged && this.cache) {
      this.cache.invalidateUser(id);
    }

    // Never log `dto.password`/`passwordHash` — only the fields it's safe
    // for an owner reviewing history to see. `passwordChanged` is a boolean
    // flag, not the value, so a password rotation is still visible in the
    // trail without the audit log becoming a secondary place secrets leak.
    await this.audit.record({
      userId: actor.id,
      action: 'staff.updated',
      entity: 'User',
      entityId: id,
      metadata: {
        name: dto.name,
        email: normalizedEmail,
        phone: dto.phone,
        roleId: dto.roleId,
        isActive: dto.isActive,
        branchIds: uniqueBranchIds,
        passwordChanged: Boolean(dto.password),
      },
    });

    return updated;
  }

  async remove(restaurantId: string, actor: SessionUser, id: string) {
    if (id === actor.id) {
      throw new BadRequestException('You cannot delete your own account');
    }

    const existing = await this.prisma.user.findFirst({
      where: { id, restaurantId },
      include: {
        role: {
          include: {
            permissions: { include: { permission: { select: { key: true } } } },
          },
        },
      },
    });
    if (!existing) {
      throw new NotFoundException('Staff account not found');
    }

    this.assertRoleAssignableByActor(actor, existing.role);

    if (existing.role.name === 'OWNER') {
      const otherActiveOwners = await this.prisma.user.count({
        where: {
          restaurantId,
          isActive: true,
          id: { not: id },
          role: { name: 'OWNER' },
        },
      });
      if (otherActiveOwners === 0) {
        throw new BadRequestException('Cannot delete the last active owner');
      }
    }

    try {
      await this.prisma.user.delete({ where: { id } });
      if (this.cache) {
        this.cache.invalidateUser(id);
      }
    } catch (err) {
      // Order/Refund/PurchaseOrder/... all keep a required, non-cascading
      // reference to the staff member who created them, so history is never
      // silently lost. Once a staffer has touched a real order they can no
      // longer be hard-deleted — disable them instead (`isActive: false`).
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2003'
      ) {
        throw new BadRequestException(
          'This staff account has order, purchase, or inventory history and cannot be deleted. Disable it instead.',
        );
      }
      throw err;
    }

    await this.audit.record({
      userId: actor.id,
      action: 'staff.deleted',
      entity: 'User',
      entityId: id,
      metadata: { name: existing.name, email: existing.email },
    });

    return { ok: true };
  }

  // --- Departments ---------------------------------------------------------

  listDepartments(restaurantId: string) {
    return this.prisma.department.findMany({
      where: { restaurantId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { users: true } } },
    });
  }

  async createDepartment(
    restaurantId: string,
    actorId: string,
    dto: DepartmentDto,
  ) {
    try {
      const dept = await this.prisma.department.create({
        data: { restaurantId, name: dto.name },
      });
      await this.audit.record({
        userId: actorId,
        action: 'department.created',
        entity: 'Department',
        entityId: dept.id,
        metadata: { name: dept.name },
      });
      return dept;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          'A department with this name already exists',
        );
      }
      throw err;
    }
  }

  async renameDepartment(
    restaurantId: string,
    actorId: string,
    id: string,
    dto: DepartmentDto,
  ) {
    const existing = await this.prisma.department.findFirst({
      where: { id, restaurantId },
    });
    if (!existing) throw new NotFoundException('Department not found');
    try {
      const dept = await this.prisma.department.update({
        where: { id },
        data: { name: dto.name },
      });
      await this.audit.record({
        userId: actorId,
        action: 'department.renamed',
        entity: 'Department',
        entityId: id,
        metadata: { from: existing.name, to: dto.name },
      });
      return dept;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          'A department with this name already exists',
        );
      }
      throw err;
    }
  }

  async removeDepartment(restaurantId: string, actorId: string, id: string) {
    const existing = await this.prisma.department.findFirst({
      where: { id, restaurantId },
    });
    if (!existing) throw new NotFoundException('Department not found');
    // users.departmentId is ON DELETE SET NULL: staff are kept, just unassigned.
    await this.prisma.department.delete({ where: { id } });
    await this.audit.record({
      userId: actorId,
      action: 'department.deleted',
      entity: 'Department',
      entityId: id,
      metadata: { name: existing.name },
    });
    return { ok: true };
  }

  // --- Per-user permission overrides ---------------------------------------

  /**
   * Replace a user's overrides. Guard rails:
   *  - you can't change your own overrides (no self-escalation or self-lockout),
   *  - the OWNER role is never overridable (can't strand the account),
   *  - you can only GRANT a permission you hold yourself (no escalation),
   *  - unknown keys and duplicate keys are rejected, past expiries too.
   */
  async setPermissionOverrides(
    restaurantId: string,
    actor: SessionUser,
    targetId: string,
    dto: SetPermissionOverridesDto,
  ) {
    if (targetId === actor.id) {
      throw new BadRequestException(
        'You cannot change your own permission overrides',
      );
    }
    const target = await this.prisma.user.findFirst({
      where: { id: targetId, restaurantId },
      include: {
        role: {
          include: {
            permissions: { include: { permission: { select: { key: true } } } },
          },
        },
      },
    });
    if (!target) throw new NotFoundException('Staff account not found');
    if (target.role.name === 'OWNER') {
      throw new BadRequestException(
        'The owner role cannot have permission overrides',
      );
    }
    this.assertRoleAssignableByActor(actor, target.role);

    const keys = dto.overrides.map((o) => o.permissionKey);
    if (new Set(keys).size !== keys.length) {
      throw new BadRequestException('Each permission can appear only once');
    }
    const perms = await this.prisma.permission.findMany({
      where: { key: { in: keys } },
    });
    const byKey = new Map(perms.map((p) => [p.key, p]));
    const now = Date.now();
    for (const o of dto.overrides) {
      if (!byKey.has(o.permissionKey)) {
        throw new BadRequestException(`Unknown permission: ${o.permissionKey}`);
      }
      if (
        o.effect === 'GRANT' &&
        !permissionSatisfied(actor.permissions, o.permissionKey)
      ) {
        throw new BadRequestException(
          `You cannot grant "${o.permissionKey}" because you do not hold it yourself`,
        );
      }
      if (o.expiresAt && new Date(o.expiresAt).getTime() <= now) {
        throw new BadRequestException('Expiry must be in the future');
      }
    }

    await this.prisma.$transaction([
      this.prisma.userPermissionOverride.deleteMany({
        where: { userId: targetId },
      }),
      this.prisma.userPermissionOverride.createMany({
        data: dto.overrides.map((o) => ({
          userId: targetId,
          permissionId: byKey.get(o.permissionKey)!.id,
          effect: o.effect,
          reason: o.reason || null,
          expiresAt: o.expiresAt ? new Date(o.expiresAt) : null,
        })),
      }),
      this.prisma.user.update({
        where: { id: targetId },
        data: { permissionsVersion: { increment: 1 } },
      }),
    ]);

    if (this.cache) {
      this.cache.invalidateUser(targetId);
    }

    await this.audit.record({
      userId: actor.id,
      action: 'staff.permissions_overridden',
      entity: 'User',
      entityId: targetId,
      metadata: {
        overrides: dto.overrides.map((o) => ({
          key: o.permissionKey,
          effect: o.effect,
          expiresAt: o.expiresAt ?? null,
        })),
      },
    });

    return this.prisma.user.findFirstOrThrow({
      where: { id: targetId },
      select: SELECT,
    });
  }

  private assertRoleAssignableByActor(
    actor: SessionUser,
    role: {
      name: string;
      permissions?: { permission: { key: string } }[];
    },
  ) {
    if (
      (role.name === 'OWNER' || role.name === 'ADMINISTRATOR') &&
      actor.roleName !== 'OWNER'
    ) {
      throw new ForbiddenException(
        `Only an Owner can assign or manage the ${role.name} role`,
      );
    }
    const roleKeys = (role.permissions ?? []).map((rp) => rp.permission.key);
    const missing = roleKeys.filter(
      (k) => !permissionSatisfied(actor.permissions, k),
    );
    if (missing.length > 0) {
      throw new ForbiddenException(
        `Cannot manage a role holding permissions you lack: ${missing.join(', ')}`,
      );
    }
  }

  private async assertDepartmentInRestaurant(
    restaurantId: string,
    departmentId: string | null | undefined,
  ) {
    if (!departmentId) return;
    const dept = await this.prisma.department.findFirst({
      where: { id: departmentId, restaurantId },
    });
    if (!dept)
      throw new BadRequestException('Department not found for this restaurant');
  }

  private async assertRoleInRestaurant(restaurantId: string, roleId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, restaurantId },
      include: {
        permissions: { include: { permission: { select: { key: true } } } },
      },
    });
    if (!role) {
      throw new BadRequestException('Role not found for this restaurant');
    }
    return role;
  }

  private async assertBranchesInRestaurant(
    restaurantId: string,
    branchIds: string[],
  ) {
    const uniqueBranchIds = [...new Set(branchIds)];
    const count = await this.prisma.branch.count({
      where: { id: { in: uniqueBranchIds }, restaurantId },
    });
    if (count !== uniqueBranchIds.length) {
      throw new BadRequestException('One or more branches are invalid');
    }
  }
}
