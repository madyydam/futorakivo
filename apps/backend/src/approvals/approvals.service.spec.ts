import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  UnauthorizedException,
  ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApprovalOutcome } from '@prisma/client';
import * as crypto from 'crypto';
import { ApprovalsService } from './approvals.service';
import { ApprovalGuard } from '../common/guards/approval.guard';
import { PrismaService } from '../prisma/prisma.service';
import { PinHasherService } from '../auth/pin-hasher.service';

describe('ApprovalsService & ApprovalGuard', () => {
  let service: ApprovalsService;
  let guard: ApprovalGuard;
  let prisma: any;
  let pinHasher: any;
  let reflector: Reflector;

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
      },
      deviceRegistration: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      branch: {
        findFirst: jest.fn(),
      },
      approvalToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      approvalLog: {
        create: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
    };

    pinHasher = {
      computeLookup: jest.fn((restId, pin) => `lookup-${restId}-${pin}`),
      verifyPin: jest.fn(),
    };

    reflector = new Reflector();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalsService,
        ApprovalGuard,
        { provide: PrismaService, useValue: prisma },
        { provide: PinHasherService, useValue: pinHasher },
        { provide: Reflector, useValue: reflector },
      ],
    }).compile();

    service = module.get<ApprovalsService>(ApprovalsService);
    guard = module.get<ApprovalGuard>(ApprovalGuard);
  });

  describe('requestApproval', () => {
    it('throws UnauthorizedException if manager PIN is invalid', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.requestApproval({
          restaurantId: 'rest-1',
          requesterId: 'u-waiter',
          dto: {
            managerPin: '999999',
            permissionKey: 'order.discount_apply',
            targetEntity: 'Order',
            targetId: 'ord-1',
            reason: 'Customer goodwill discount',
          },
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws ForbiddenException if approver lacks required permission', async () => {
      const mockWaiterApprover = {
        id: 'u-other-waiter',
        pinHash: 'hash-waiter',
        role: { name: 'WAITER', permissions: [] },
      };
      prisma.user.findFirst.mockResolvedValue(mockWaiterApprover);
      pinHasher.verifyPin.mockResolvedValue(true);

      await expect(
        service.requestApproval({
          restaurantId: 'rest-1',
          requesterId: 'u-waiter',
          dto: {
            managerPin: '123456',
            permissionKey: 'order.discount_apply',
            targetEntity: 'Order',
            targetId: 'ord-1',
            reason: 'Customer goodwill discount',
          },
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException if non-owner attempts to approve payment QR changes', async () => {
      const mockManager = {
        id: 'u-mgr',
        pinHash: 'hash-mgr',
        role: {
          name: 'RESTAURANT_MANAGER',
          permissions: [{ permission: { key: 'qrsettings.payment' } }],
        },
      };
      prisma.user.findFirst.mockResolvedValue(mockManager);
      pinHasher.verifyPin.mockResolvedValue(true);

      await expect(
        service.requestApproval({
          restaurantId: 'rest-1',
          requesterId: 'u-waiter',
          dto: {
            managerPin: '123456',
            permissionKey: 'qrsettings.payment',
            targetEntity: 'QrSettings',
            targetId: 'qr-1',
            reason: 'Changing UPI ID',
          },
        }),
      ).rejects.toThrow(/Owner PIN approval/);
    });

    it('successfully generates 2-minute approval token when manager approves', async () => {
      const mockManager = {
        id: 'u-mgr',
        name: 'Manager Alice',
        pinHash: 'hash-mgr',
        role: {
          name: 'RESTAURANT_MANAGER',
          permissions: [{ permission: { key: 'order.discount_apply' } }],
        },
      };
      prisma.user.findFirst.mockResolvedValue(mockManager);
      pinHasher.verifyPin.mockResolvedValue(true);
      prisma.deviceRegistration.findFirst.mockResolvedValue({ id: 'dev-1' });

      const res = await service.requestApproval({
        restaurantId: 'rest-1',
        requesterId: 'u-waiter',
        dto: {
          managerPin: '123456',
          permissionKey: 'order.discount_apply',
          targetEntity: 'Order',
          targetId: 'ord-1',
          reason: 'Manager agreed to discount',
        },
      });

      expect(res.approvalToken).toHaveLength(64);
      expect(res.approverName).toBe('Manager Alice');
      expect(res.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(prisma.approvalToken.create).toHaveBeenCalled();
      expect(prisma.approvalLog.create).toHaveBeenCalled();
    });
  });

  describe('consumeApprovalToken', () => {
    it('throws ForbiddenException if token has already been consumed', async () => {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');

      prisma.approvalToken.findUnique.mockResolvedValue({
        id: 'tok-1',
        tokenHash,
        restaurantId: 'rest-1',
        permissionKey: 'order.void_item',
        targetId: 'item-1',
        consumedAt: new Date(), // Already consumed!
        expiresAt: new Date(Date.now() + 60_000),
      });

      await expect(
        service.consumeApprovalToken('rest-1', rawToken, 'order.void_item'),
      ).rejects.toThrow(/already been consumed/);
    });

    it('throws ForbiddenException if token has expired', async () => {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');

      prisma.approvalToken.findUnique.mockResolvedValue({
        id: 'tok-1',
        tokenHash,
        restaurantId: 'rest-1',
        permissionKey: 'order.void_item',
        targetId: 'item-1',
        consumedAt: null,
        expiresAt: new Date(Date.now() - 5000), // Expired 5 seconds ago!
      });

      await expect(
        service.consumeApprovalToken('rest-1', rawToken, 'order.void_item'),
      ).rejects.toThrow(/has expired/);
    });

    it('atomically consumes token and updates log', async () => {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');

      prisma.approvalToken.findUnique.mockResolvedValue({
        id: 'tok-1',
        tokenHash,
        restaurantId: 'rest-1',
        permissionKey: 'order.void_item',
        targetId: 'item-1',
        consumedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        approverId: 'u-mgr',
      });
      prisma.approvalToken.update.mockResolvedValue({
        id: 'tok-1',
        consumedAt: new Date(),
        approverId: 'u-mgr',
      });

      const res = await service.consumeApprovalToken(
        'rest-1',
        rawToken,
        'order.void_item',
        'item-1',
      );

      expect(res.approverId).toBe('u-mgr');
      expect(prisma.approvalToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'tok-1' } }),
      );
      expect(prisma.approvalLog.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { outcome: ApprovalOutcome.USED },
        }),
      );
    });
  });

  describe('ApprovalGuard', () => {
    function mockContext(user: any, headers: Record<string, string> = {}, params: any = {}): ExecutionContext {
      return {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({ user, headers, params }),
        }),
      } as unknown as ExecutionContext;
    }

    it('bypasses approval if user already possesses the permission', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('order.void_item');

      const user = {
        id: 'u-mgr',
        restaurantId: 'rest-1',
        permissions: ['order.void_item'],
      };
      const ctx = mockContext(user);

      expect(await guard.canActivate(ctx)).toBe(true);
    });

    it('throws ForbiddenException if user lacks permission and x-approval-token is missing', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('order.void_item');

      const user = {
        id: 'u-waiter',
        restaurantId: 'rest-1',
        permissions: ['order.create'], // lacks void_item
      };
      const ctx = mockContext(user);

      await expect(guard.canActivate(ctx)).rejects.toThrow(/Manager approval required/);
    });

    it('consumes token and attaches approvalContext when valid x-approval-token provided', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('order.void_item');

      const user = {
        id: 'u-waiter',
        restaurantId: 'rest-1',
        permissions: ['order.create'],
      };
      const headers = { 'x-approval-token': 'valid-approval-token-hex-32-chars-ok' };
      const req: any = { user, headers, params: { id: 'item-1' } };
      const ctx = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({ getRequest: () => req }),
      } as unknown as ExecutionContext;

      jest.spyOn(service, 'consumeApprovalToken').mockResolvedValue({
        id: 'tok-1',
        approverId: 'u-mgr-1',
        consumedAt: new Date(),
      } as any);

      expect(await guard.canActivate(ctx)).toBe(true);
      expect(req.approvalContext.approverId).toBe('u-mgr-1');
    });
  });
});
