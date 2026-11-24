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
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    branch: {
      count: jest.fn(),
    },
    order: {
      aggregate: jest.fn(),
    },
    deviceRegistration: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
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
});
