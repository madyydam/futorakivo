import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { SuperAdminGuard } from './super-admin.guard';
import { SuperAdminService } from './super-admin.service';

describe('SuperAdminService & Guard', () => {
  let service: SuperAdminService;
  let guard: SuperAdminGuard;
  let jwtService: JwtService;

  const mockPrisma = {
    restaurant: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    branch: {
      count: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    role: {
      create: jest.fn(),
    },
    rolePermission: {
      createMany: jest.fn(),
    },
    userBranch: {
      create: jest.fn(),
    },
    permission: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    order: {
      aggregate: jest.fn(),
    },
    deviceRegistration: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  };

  const mockAudit = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  const mockJwt = {
    sign: jest.fn().mockReturnValue('mock_super_admin_jwt'),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    process.env.SUPER_ADMIN_EMAIL = 'admin@futoragroup.in';
    process.env.SUPER_ADMIN_PASSWORD = 'KivokoRoot@2026!';
    process.env.JWT_SECRET = 'test-secret-at-least-32-characters-long';
    process.env.SUPER_ADMIN_KEY = 'kivoko_master_superadmin_secret_key_2026';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuperAdminService,
        SuperAdminGuard,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<SuperAdminService>(SuperAdminService);
    guard = module.get<SuperAdminGuard>(SuperAdminGuard);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Super Admin Authentication', () => {
    it('successfully logs in with valid master credentials', async () => {
      const result = await service.login('admin@futoragroup.in', 'KivokoRoot@2026!');
      expect(result).toHaveProperty('accessToken', 'mock_super_admin_jwt');
      expect(result.user.role).toBe('SUPER_ADMIN');
      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'admin@futoragroup.in',
          role: 'SUPER_ADMIN',
        }),
        expect.anything(),
      );
    });

    it('rejects incorrect password with UnauthorizedException', async () => {
      await expect(
        service.login('admin@futoragroup.in', 'WrongPassword!'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Support Impersonation ("Login as Tenant")', () => {
    it('mints a 15-minute token and logs audit event', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue({
        id: 'rest_123',
        name: 'Royal Bistro',
        users: [
          { id: 'usr_owner', email: 'owner@bistro.com', name: 'Chef Owner' },
        ],
      });

      const res = await service.impersonateTenant('rest_123', 'admin@futoragroup.in');
      expect(res.restaurantName).toBe('Royal Bistro');
      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'usr_owner',
          restaurantId: 'rest_123',
          role: 'OWNER',
          isImpersonating: true,
        }),
        expect.objectContaining({ expiresIn: '15m' }),
      );
      expect(mockAudit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SUPER_ADMIN_IMPERSONATE',
          entityId: 'rest_123',
        }),
      );
    });
  });

  describe('Tenant Killswitch', () => {
    it('suspends restaurant and logs audit event', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue({
        id: 'rest_bad',
        status: 'ACTIVE',
      });
      mockPrisma.restaurant.update.mockResolvedValue({
        id: 'rest_bad',
        status: 'SUSPENDED',
      });

      const res = await service.killswitchTenant('rest_bad', 'Fraudulent UPI', 'admin@futoragroup.in');
      expect(res.status).toBe('SUSPENDED');
      expect(mockPrisma.restaurant.update).toHaveBeenCalledWith({
        where: { id: 'rest_bad' },
        data: { status: 'SUSPENDED' },
      });
      expect(mockAudit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SUPER_ADMIN_KILLSWITCH',
          entityId: 'rest_bad',
        }),
      );
    });
  });

  describe('Hardware Fleet Management', () => {
    it('returns list of paired terminals', async () => {
      mockPrisma.deviceRegistration.findMany.mockResolvedValue([
        {
          id: 'dev_1',
          label: 'Counter POS 1',
          status: 'PAIRED',
          lastIp: '192.168.1.10',
          restaurant: { name: 'Royal Bistro' },
          outlet: { name: 'Main' },
          createdAt: new Date(),
        },
      ]);

      const fleet = await service.getHardwareFleet();
      expect(fleet).toHaveLength(1);
      expect(fleet[0].restaurantName).toBe('Royal Bistro');
      expect(fleet[0].label).toBe('Counter POS 1');
    });

    it('revokes device and records audit trail', async () => {
      mockPrisma.deviceRegistration.findUnique.mockResolvedValue({
        id: 'dev_stolen',
        label: 'Patio iPad',
      });
      mockPrisma.deviceRegistration.update.mockResolvedValue({
        id: 'dev_stolen',
        status: 'REVOKED',
      });

      const res = await service.revokeDevice('dev_stolen', 'admin@futoragroup.in');
      expect(res.status).toBe('REVOKED');
      expect(mockAudit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SUPER_ADMIN_DEVICE_REVOKE',
          entityId: 'dev_stolen',
        }),
      );
    });
  });

  describe('SuperAdminGuard', () => {
    it('authorizes requests with master API key header', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              'x-super-admin-key': 'kivoko_master_superadmin_secret_key_2026',
            },
          }),
        }),
      } as any;

      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('authorizes requests with valid Bearer token', () => {
      mockJwt.verify.mockReturnValue({
        email: 'admin@futoragroup.in',
        role: 'SUPER_ADMIN',
      });

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Bearer valid_superadmin_token',
            },
          }),
        }),
      } as any;

      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('rejects requests with missing token', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
          }),
        }),
      } as any;

      expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
    });

    it('rejects tokens with non-SUPER_ADMIN role', () => {
      mockJwt.verify.mockReturnValue({
        email: 'waiter@bistro.com',
        role: 'WAITER',
      });

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Bearer waiter_token',
            },
          }),
        }),
      } as any;

      expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
    });
  });

  describe('Tenant Lifecycle & Direct Provisioning', () => {
    it('creates a new tenant in PENDING_APPROVAL status with role and owner', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.restaurant.create.mockResolvedValue({
        id: 'rest_new',
        name: 'Mumbai Spices',
        status: 'PENDING_APPROVAL',
        plan: 'Growth',
        ownerPhone: '9876543210',
        city: 'Mumbai',
        activationCode: null,
        isActivated: false,
        activatedAt: null,
        subscriptionExpiresAt: null,
        billingCycle: 'MONTHLY',
        utrNumber: null,
      });
      mockPrisma.branch.create.mockResolvedValue({
        id: 'br_main',
        name: 'Mumbai Spices Main Outlet',
        address: 'Mumbai',
      });
      mockPrisma.role.create.mockResolvedValue({ id: 'role_owner' });
      mockPrisma.user.create.mockResolvedValue({
        id: 'usr_owner',
        name: 'Raj Owner',
        email: 'raj@spices.com',
      });
      mockPrisma.userBranch.create.mockResolvedValue({});

      const tenant = await service.createTenant(
        {
          restaurantName: 'Mumbai Spices',
          ownerName: 'Raj Owner',
          email: 'raj@spices.com',
          phone: '9876543210',
          city: 'Mumbai',
          plan: 'Growth',
        },
        'admin@futoragroup.in',
      );

      expect(tenant.id).toBe('rest_new');
      expect(tenant.restaurantName).toBe('Mumbai Spices');
      expect(tenant.status).toBe('PENDING_APPROVAL');
      expect(mockAudit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SUPER_ADMIN_CREATE_TENANT',
          entityId: 'rest_new',
        }),
      );
    });

    it('records audit log on logout', async () => {
      const res = await service.logout('admin@futoragroup.in');
      expect(res.success).toBe(true);
      expect(mockAudit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SUPER_ADMIN_LOGOUT',
        }),
      );
    });
  });

  describe('12-Digit License Activation & Subscription Timing', () => {
    it('approves tenant and generates 12-digit code in 4-4-4 format without starting timer', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue({
        id: 'rest_pending',
        name: 'Delhi Dhaba',
        status: 'PENDING_APPROVAL',
      });
      mockPrisma.restaurant.update.mockImplementation(({ data }) => ({
        id: 'rest_pending',
        ...data,
      }));

      const res = await service.approveTenant('rest_pending', 'admin@futoragroup.in');
      expect(res.status).toBe('APPROVED');
      expect(res.activationCode).toMatch(/^\d{4}-\d{4}-\d{4}$/);
      expect(mockPrisma.restaurant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'APPROVED',
            isActivated: false,
            activatedAt: null,
            subscriptionExpiresAt: null,
          }),
        }),
      );
    });

    it('activates license and starts subscription timer at that exact moment', async () => {
      const code = '4829-1093-8572';
      mockPrisma.restaurant.findFirst.mockResolvedValue({
        id: 'rest_approved',
        name: 'Delhi Dhaba',
        status: 'APPROVED',
        activationCode: code,
        isActivated: false,
        billingCycle: 'MONTHLY',
        plan: 'Growth',
      });
      mockPrisma.restaurant.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.restaurant.findUniqueOrThrow.mockResolvedValue({
        id: 'rest_approved',
        name: 'Delhi Dhaba',
        status: 'ACTIVE',
        plan: 'Growth',
      });

      const res = await service.activateLicense(code);
      expect(res.success).toBe(true);
      expect(res.status).toBe('ACTIVE');
      expect(res.activatedAt).toBeDefined();
      expect(res.subscriptionExpiresAt).toBeDefined();

      const activatedDate = new Date(res.activatedAt);
      const expiresDate = new Date(res.subscriptionExpiresAt);
      const daysDiff = Math.round((expiresDate.getTime() - activatedDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(30);

      expect(mockAudit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'RESTAURANT_LICENSE_ACTIVATED',
          entityId: 'rest_approved',
        }),
      );
    });

    it('throws BadRequestException if activation code was concurrently redeemed (updateMany returns count 0)', async () => {
      const code = '4829-1093-8572';
      mockPrisma.restaurant.findFirst.mockResolvedValue({
        id: 'rest_approved',
        name: 'Delhi Dhaba',
        status: 'APPROVED',
        activationCode: code,
        isActivated: false,
        billingCycle: 'MONTHLY',
        plan: 'Growth',
      });
      mockPrisma.restaurant.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.activateLicense(code)).rejects.toThrow(
        'License activation race condition: this license has already been activated.',
      );
    });
  });

  describe('System Health & Platform Metrics', () => {
    it('returns system health with database latency and fleet stats', async () => {
      mockPrisma.restaurant.count.mockResolvedValue(10);
      const health = await service.getSystemHealth();
      expect(health.status).toBe('HEALTHY');
      expect(health.database.status).toBe('CONNECTED');
      expect(health.database.latencyMs).toBeGreaterThanOrEqual(0);
      expect(health.process.memoryHeapUsedMb).toBeGreaterThan(0);
      expect(health.fleet.totalRestaurants).toBe(10);
    });

    it('returns platform audit logs', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([
        {
          id: 'log_1',
          action: 'SUPER_ADMIN_LOGIN_SUCCESS',
          entity: 'SuperAdmin',
          entityId: null,
          metadata: {},
          createdAt: new Date(),
          user: null,
        },
      ]);

      const logs = await service.getAuditLogs(10);
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('SUPER_ADMIN_LOGIN_SUCCESS');
      expect(logs[0].userName).toBe('System / Super Admin');
    });
  });
});
