import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DeviceStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { DevicesService } from './devices.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DevicesService', () => {
  let service: DevicesService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      branch: {
        findFirst: jest.fn(),
      },
      devicePairingCode: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      deviceRegistration: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DevicesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DevicesService>(DevicesService);
  });

  describe('createPairingCode', () => {
    it('throws NotFoundException if outlet does not belong to restaurant', async () => {
      prisma.branch.findFirst.mockResolvedValue(null);

      await expect(
        service.createPairingCode('rest-1', 'bad-branch', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates 6-char pairing code with 10-minute expiry', async () => {
      prisma.branch.findFirst.mockResolvedValue({ id: 'branch-1' });
      prisma.devicePairingCode.create.mockImplementation((args: any) => ({
        id: 'code-1',
        ...args.data,
      }));

      const result = await service.createPairingCode(
        'rest-1',
        'branch-1',
        'user-1',
      );
      expect(result.code).toHaveLength(6);
      expect(result.outletId).toBe('branch-1');
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('pairDevice', () => {
    it('throws BadRequestException for invalid or expired code', async () => {
      prisma.devicePairingCode.findFirst.mockResolvedValue(null);

      await expect(
        service.pairDevice({ code: 'EXPIRE', label: 'POS Terminal 1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('successfully pairs device and returns raw bearer token', async () => {
      const codeRecord = {
        id: 'code-id-1',
        restaurantId: 'rest-1',
        outletId: 'branch-1',
        createdBy: 'user-admin',
      };
      prisma.devicePairingCode.findFirst.mockResolvedValue(codeRecord);
      prisma.devicePairingCode.updateMany = jest
        .fn()
        .mockResolvedValue({ count: 1 });
      prisma.deviceRegistration.create.mockImplementation((args: any) => ({
        id: 'dev-1',
        ...args.data,
      }));

      const res = await service.pairDevice(
        { code: 'VALID1', label: 'POS Terminal 1' },
        '192.168.1.50',
      );

      expect(res.deviceId).toBe('dev-1');
      expect(res.deviceToken).toBeDefined();
      expect(res.deviceToken).toHaveLength(64); // 32 bytes hex
      expect(res.status).toBe(DeviceStatus.APPROVED);
      expect(prisma.devicePairingCode.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'code-id-1', usedAt: null } }),
      );
    });

    it('rejects pairing when code was raced and already consumed', async () => {
      const codeRecord = {
        id: 'code-id-1',
        restaurantId: 'rest-1',
        outletId: 'branch-1',
      };
      prisma.devicePairingCode.findFirst.mockResolvedValue(codeRecord);
      prisma.devicePairingCode.updateMany = jest
        .fn()
        .mockResolvedValue({ count: 0 }); // Someone else consumed it!

      await expect(
        service.pairDevice({ code: 'RACED1', label: 'POS Terminal 2' }),
      ).rejects.toThrow('Invalid or expired device pairing code');
    });
  });

  describe('verifyDeviceToken', () => {
    it('returns device when raw token matches stored tokenHash', async () => {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');

      prisma.deviceRegistration.findUnique.mockResolvedValue({
        id: 'dev-1',
        tokenHash,
        status: DeviceStatus.APPROVED,
      });

      const device = await service.verifyDeviceToken(rawToken);
      expect(device).not.toBeNull();
      expect(device?.id).toBe('dev-1');
      expect(prisma.deviceRegistration.findUnique).toHaveBeenCalledWith({
        where: { tokenHash },
        include: { outlet: true },
      });
    });

    it('returns null for short/invalid token', async () => {
      expect(await service.verifyDeviceToken('')).toBeNull();
      expect(await service.verifyDeviceToken('short')).toBeNull();
    });
  });

  describe('revokeDevice', () => {
    it('marks device as REVOKED and wipes tokenHash', async () => {
      prisma.deviceRegistration.findFirst.mockResolvedValue({ id: 'dev-1' });
      prisma.deviceRegistration.update.mockResolvedValue({
        id: 'dev-1',
        status: DeviceStatus.REVOKED,
      });

      await service.revokeDevice('rest-1', 'dev-1', 'admin-1');

      expect(prisma.deviceRegistration.update).toHaveBeenCalledWith({
        where: { id: 'dev-1' },
        data: expect.objectContaining({
          status: DeviceStatus.REVOKED,
          tokenHash: null,
          revokedBy: 'admin-1',
        }),
      });
    });
  });
});
