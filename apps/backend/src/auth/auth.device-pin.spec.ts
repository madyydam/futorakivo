import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DeviceStatus } from '@prisma/client';
import { AuthService } from './auth.service';
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
      },
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: TwoFactorService, useValue: {} },
        { provide: PinHasherService, useValue: pinHasher },
        { provide: DevicesService, useValue: devices },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('devicePinLogin', () => {
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

    it('handles wrong PIN: records failed attempt and increments count', async () => {
      devices.verifyDeviceToken.mockResolvedValue({
        id: 'dev-1',
        restaurantId: 'rest-1',
        status: DeviceStatus.APPROVED,
        failedAttempts: 2,
        lockedUntil: null,
      });

      // No user matches lookup
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        authService.devicePinLogin('valid-token', 'wrong-pin', '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);

      expect(prisma.pinAttempt.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ success: false, deviceId: 'dev-1' }),
        }),
      );
      expect(prisma.deviceRegistration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ failedAttempts: 3 }),
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

      await expect(
        authService.devicePinLogin('valid-token', 'wrong-pin', '127.0.0.1'),
      ).rejects.toThrow(/Device locked for 15 minutes/);

      expect(prisma.deviceRegistration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            failedAttempts: 5,
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

      await expect(
        authService.devicePinLogin('valid-token', 'wrong-pin', '127.0.0.1'),
      ).rejects.toThrow(/Incorrect PIN/);

      // Should reset failedAttempts to 1, NOT re-lock immediately
      expect(prisma.deviceRegistration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            failedAttempts: 1,
            lockedUntil: null,
          }),
        }),
      );
    });

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
        authService.updateStaffPin('rest-1', 'admin-1', {
          staffUserId: 'u-missing',
          newPin: '654321',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException if another staff in the same restaurant has the PIN', async () => {
      prisma.user.findFirst
        .mockResolvedValueOnce({ id: 'u-1', restaurantId: 'rest-1' }) // staff exists
        .mockResolvedValueOnce({ id: 'u-other', restaurantId: 'rest-1' }); // collision

      await expect(
        authService.updateStaffPin('rest-1', 'admin-1', {
          staffUserId: 'u-1',
          newPin: '654321',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('successfully hashes and saves new PIN', async () => {
      prisma.user.findFirst
        .mockResolvedValueOnce({ id: 'u-1', restaurantId: 'rest-1' }) // staff exists
        .mockResolvedValueOnce(null); // no collision

      prisma.user.update.mockResolvedValue({ id: 'u-1' });

      const res = await authService.updateStaffPin('rest-1', 'admin-1', {
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
          }),
        }),
      );
    });
  });
});
