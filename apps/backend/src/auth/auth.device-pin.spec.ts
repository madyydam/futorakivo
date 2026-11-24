import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DeviceStatus } from '@prisma/client';
import type { SessionUser } from '@futora/types';
import { AuthService } from './auth.service';
import { AuditService } from '../audit/audit.service';
import { PermissionsCacheService } from '../permissions/permissions-cache.service';
import { PrismaService } from '../prisma/prisma.service';
import { TwoFactorService } from './two-factor.service';
import { PinHasherService } from './pin-hasher.service';
import { DevicesService } from '../devices/devices.service';

describe('AuthService - Device PIN Login & Staff PIN Management', () => {
  let authService: AuthService;
  let prisma: any;
  let jwt: any;
  let devices: any;
  let pinHasher: any;
  let audit: { record: jest.Mock };
  let cache: { invalidateUser: jest.Mock };

  const ownerActor: SessionUser = {
    id: 'owner-1',
    restaurantId: 'rest-1',
    name: 'Owner',
    roleId: 'role-owner',
    roleName: 'OWNER',
    permissions: ['staff.manage', 'users.manage', 'settings.tax'],
    permissionsVersion: 1,
  };

  const managerActor: SessionUser = {
    id: 'mgr-1',
    restaurantId: 'rest-1',
    name: 'Manager',
    roleId: 'role-mgr',
    roleName: 'RESTAURANT_MANAGER',
    permissions: ['staff.manage', 'users.manage', 'order.create'],
    permissionsVersion: 1,
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      pinAttempt: {
        create: jest.fn(),
      },
      deviceRegistration: {
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      restaurant: {
        findUnique: jest.fn().mockResolvedValue({ status: 'ACTIVE', isActivated: true }),
      },
      $transaction: jest.fn((cb: any) =>
        typeof cb === 'function' ? cb(prisma) : Promise.all(cb),
      ),
    };

    jwt = {
      signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
    };

    devices = {
      verifyDeviceToken: jest.fn(),
    };

    pinHasher = {
      computeLookup: jest.fn((restId, pin) => `lookup-${restId}-${pin}`),
      verifyPin: jest.fn(),
      hashPin: jest.fn((pin) => Promise.resolve(`hash-${pin}`)),
    };

    audit = { record: jest.fn().mockResolvedValue(undefined) };
    cache = { invalidateUser: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: TwoFactorService, useValue: {} },
        { provide: PinHasherService, useValue: pinHasher },
        { provide: DevicesService, useValue: devices },
        { provide: PermissionsCacheService, useValue: cache },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('devicePinLogin', () => {
    it('throws UnauthorizedException if restaurant is suspended by Super Admin', async () => {
      devices.verifyDeviceToken.mockResolvedValue({
        id: 'dev-1',
        restaurantId: 'rest-1',
        status: DeviceStatus.APPROVED,
      });
      prisma.restaurant.findUnique.mockResolvedValue({ status: 'SUSPENDED' });

      await expect(
        authService.devicePinLogin('valid-token', '123456', '127.0.0.1'),
      ).rejects.toThrow(
        'This restaurant account has been suspended by Super Admin.',
      );
    });

    it('throws UnauthorizedException if raw device token is missing', async () => {
      await expect(
        authService.devicePinLogin('', '123456', '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException if device is not approved', async () => {
      devices.verifyDeviceToken.mockResolvedValue({
        id: 'dev-1',
        status: DeviceStatus.PENDING,
      });

      await expect(
        authService.devicePinLogin('valid-token', '123456', '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException if device is locked out', async () => {
      devices.verifyDeviceToken.mockResolvedValue({
        id: 'dev-1',
        status: DeviceStatus.APPROVED,
        lockedUntil: new Date(Date.now() + 10 * 60 * 1000), // locked for 10 mins
      });

      await expect(
        authService.devicePinLogin('valid-token', '123456', '127.0.0.1'),
      ).rejects.toThrow(/temporarily locked/);
    });

    it('handles wrong PIN: records failed attempt and atomically increments count', async () => {
      devices.verifyDeviceToken.mockResolvedValue({
        id: 'dev-1',
        restaurantId: 'rest-1',
        status: DeviceStatus.APPROVED,
        failedAttempts: 2,
        lockedUntil: null,
      });

      // No user matches lookup
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.deviceRegistration.update.mockResolvedValue({ failedAttempts: 3 });

      await expect(
        authService.devicePinLogin('valid-token', 'wrong-pin', '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.pinAttempt.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ success: false, deviceId: 'dev-1' }),
        }),
      );
      expect(prisma.deviceRegistration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ failedAttempts: { increment: 1 } }),
        }),
      );
    });

    it('locks device for 15 minutes on 5th failed attempt', async () => {
      devices.verifyDeviceToken.mockResolvedValue({
        id: 'dev-1',
        restaurantId: 'rest-1',
        status: DeviceStatus.APPROVED,
        failedAttempts: 4,
        lockedUntil: null,
      });

      prisma.user.findFirst.mockResolvedValue(null);
      prisma.deviceRegistration.update
        .mockResolvedValueOnce({ failedAttempts: 5 })
        .mockResolvedValueOnce({ failedAttempts: 5 });

      await expect(
        authService.devicePinLogin('valid-token', 'wrong-pin', '127.0.0.1'),
      ).rejects.toThrow(/Device locked for 15 minutes/);

      expect(prisma.deviceRegistration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lockedUntil: expect.any(Date),
          }),
        }),
      );
    });

    it('resets failed attempt counter when previous lockout has expired', async () => {
      devices.verifyDeviceToken.mockResolvedValue({
        id: 'dev-1',
        restaurantId: 'rest-1',
        status: DeviceStatus.APPROVED,
        failedAttempts: 5,
        lockedUntil: new Date(Date.now() - 1000), // lockout expired 1 second ago
      });

      prisma.user.findFirst.mockResolvedValue(null);
      prisma.deviceRegistration.updateMany.mockResolvedValue({ count: 1 });

      await expect(
        authService.devicePinLogin('valid-token', 'wrong-pin', '127.0.0.1'),
      ).rejects.toThrow(/Incorrect PIN/);

      // Should reset failedAttempts to 1 via atomic updateMany, NOT re-lock immediately
      expect(prisma.deviceRegistration.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'dev-1' }),
          data: expect.objectContaining({
            failedAttempts: 1,
            lockedUntil: null,
          }),
        }),
      );
    });

    it.each([
      ['PENDING_APPROVAL', { status: 'PENDING_APPROVAL', isActivated: false }],
      ['unactivated APPROVED', { status: 'APPROVED', isActivated: false }],
      [
        'expired ACTIVE subscription',
        {
          status: 'ACTIVE',
          isActivated: true,
          subscriptionExpiresAt: new Date(Date.now() - 60_000),
        },
      ],
    ])(
      'rejects devicePinLogin when restaurant is %s',
      async (_label, restaurant) => {
        devices.verifyDeviceToken.mockResolvedValue({
          id: 'dev-1',
          restaurantId: 'rest-1',
          status: DeviceStatus.APPROVED,
        });
        prisma.restaurant.findUnique.mockResolvedValue(restaurant);

        await expect(
          authService.devicePinLogin('valid-token', '123456', '127.0.0.1'),
        ).rejects.toThrow(UnauthorizedException);
      },
    );

    it('successfully logs in with valid PIN, resets failures and returns token', async () => {
      devices.verifyDeviceToken.mockResolvedValue({
        id: 'dev-1',
        restaurantId: 'rest-1',
        outletId: 'branch-1',
        status: DeviceStatus.APPROVED,
        failedAttempts: 1,
        lockedUntil: null,
      });

      const mockUser = {
        id: 'user-waiter',
        restaurantId: 'rest-1',
        name: 'Waiter Dave',
        roleId: 'role-waiter',
        role: { name: 'WAITER', permissions: [] },
        pinHash: 'hashed-pin',
        mustChangePin: false,
        twoFactorEnabled: false,
        permissionsVersion: 2,
      };

      prisma.user.findFirst.mockResolvedValue(mockUser);
      pinHasher.verifyPin.mockResolvedValue(true);

      const result = await authService.devicePinLogin(
        'valid-token',
        '123456',
        '192.168.1.10',
      );

      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.name).toBe('Waiter Dave');
      expect(result.mustChangePin).toBe(false);

      expect(prisma.pinAttempt.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ success: true }),
        }),
      );
      expect(prisma.deviceRegistration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ failedAttempts: 0, lockedUntil: null }),
        }),
      );
    });
  });

  describe('updateStaffPin', () => {
    it('throws NotFoundException if user is not in restaurant', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        authService.updateStaffPin('rest-1', ownerActor, {
          staffUserId: 'u-missing',
          newPin: '654321',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('forbids non-OWNER from changing OWNER or ADMINISTRATOR PIN', async () => {
      prisma.user.findFirst.mockResolvedValueOnce({
        id: 'u-owner',
        restaurantId: 'rest-1',
        role: { name: 'OWNER', permissions: [] },
      });

      await expect(
        authService.updateStaffPin('rest-1', managerActor, {
          staffUserId: 'u-owner',
          newPin: '654321',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('forbids updating PIN of a user whose role holds permissions the actor lacks', async () => {
      prisma.user.findFirst.mockResolvedValueOnce({
        id: 'u-acct',
        restaurantId: 'rest-1',
        role: {
          name: 'CUSTOM_SUPER',
          permissions: [{ permission: { key: 'data.bulk_delete' } }],
        },
      });

      await expect(
        authService.updateStaffPin('rest-1', managerActor, {
          staffUserId: 'u-acct',
          newPin: '654321',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ConflictException if another staff in the same restaurant has the PIN', async () => {
      prisma.user.findFirst
        .mockResolvedValueOnce({
          id: 'u-1',
          restaurantId: 'rest-1',
          role: { name: 'WAITER', permissions: [] },
        })
        .mockResolvedValueOnce({ id: 'u-other', restaurantId: 'rest-1' }); // collision

      await expect(
        authService.updateStaffPin('rest-1', ownerActor, {
          staffUserId: 'u-1',
          newPin: '654321',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('successfully hashes, saves new PIN, invalidates cache, and records audit without leaking PIN', async () => {
      prisma.user.findFirst
        .mockResolvedValueOnce({
          id: 'u-1',
          restaurantId: 'rest-1',
          role: { name: 'WAITER', permissions: [] },
        })
        .mockResolvedValueOnce(null); // no collision

      prisma.user.update.mockResolvedValue({ id: 'u-1' });

      const res = await authService.updateStaffPin('rest-1', ownerActor, {
        staffUserId: 'u-1',
        newPin: '654321',
      });

      expect(res.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u-1' },
          data: expect.objectContaining({
            pinLookup: 'lookup-rest-1-654321',
            pinHash: 'hash-654321',
            pepperKeyId: 'v1',
            mustChangePin: false,
            permissionsVersion: { increment: 1 },
          }),
        }),
      );
      expect(cache.invalidateUser).toHaveBeenCalledWith('u-1');
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: ownerActor.id,
          action: 'staff.pin_updated',
          entity: 'User',
          entityId: 'u-1',
        }),
      );
      expect(JSON.stringify(audit.record.mock.calls[0][0])).not.toContain('654321');
    });
  });
});
