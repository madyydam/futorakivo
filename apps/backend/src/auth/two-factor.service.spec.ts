/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { SessionUser } from '@futora/types';
import { base32Decode, generateSecret, hotp, sealSecret, stepAt } from './totp';
import { TwoFactorService } from './two-factor.service';

const KEY = 'unit-test-key';

function setup(lastStep: number | null = null, updateCount = 1) {
  const secret = generateSecret();
  const user = {
    id: 'u1',
    twoFactorEnabled: true,
    twoFactorSecret: sealSecret(secret, KEY),
    twoFactorRecoveryHashes: [] as string[],
    twoFactorLastStep: lastStep,
  };
  const prisma: any = {
    user: {
      updateMany: jest.fn().mockResolvedValue({ count: updateCount }),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((cb: any) => cb(prisma)),
  };
  const config = {
    get: (k: string) => (k === 'TWO_FACTOR_KEY' ? KEY : undefined),
    getOrThrow: () => KEY,
  };
  const cache = { invalidateUser: jest.fn() };
  const svc = new TwoFactorService(
    prisma as never,
    config as never,
    { record: jest.fn() } as never,
    cache as never,
  );
  const codeAt = (offset = 0) =>
    hotp(base32Decode(secret), stepAt(Date.now()) + offset);
  return { svc, user, prisma, secret, cache, codeAt };
}

describe('TwoFactorService.verifyLogin', () => {
  it('accepts a valid code and records its step', async () => {
    const { svc, user, prisma, codeAt } = setup();
    await expect(svc.verifyLogin(user, codeAt())).resolves.toBeUndefined();
    expect(prisma.user.updateMany.mock.calls[0][0].data.twoFactorLastStep).toBe(
      stepAt(Date.now()),
    );
  });

  it('asks for a code when none is given', async () => {
    const { svc, user } = setup();
    await expect(svc.verifyLogin(user, undefined)).rejects.toThrow(
      'TWO_FACTOR_REQUIRED',
    );
  });

  it('rejects a code from a step already used (replay)', async () => {
    const { svc, user, codeAt } = setup(stepAt(Date.now()));
    await expect(svc.verifyLogin(user, codeAt())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects when a concurrent request already consumed the step', async () => {
    const { svc, user, codeAt } = setup(null, 0); // updateMany matched nothing
    await expect(svc.verifyLogin(user, codeAt())).rejects.toThrow(
      'Invalid verification code',
    );
  });

  it('locks the account after 5 wrong codes, even for a right one', async () => {
    const { svc, user, codeAt } = setup();
    for (let i = 0; i < 5; i++) {
      await expect(svc.verifyLogin(user, '000000')).rejects.toThrow(
        'Invalid verification code',
      );
    }
    await expect(svc.verifyLogin(user, codeAt())).rejects.toThrow(/Too many/);
  });

  it('consumes recovery codes atomically inside a transaction using fresh DB hashes', async () => {
    const hashA = await bcrypt.hash('ABCD1234', 4);
    const hashB = await bcrypt.hash('EFGH5678', 4);
    const { svc, user, prisma } = setup();
    user.twoFactorRecoveryHashes = [hashA, hashB];
    prisma.user.findUnique.mockResolvedValue({
      twoFactorRecoveryHashes: [hashB], // hashA already consumed concurrently
    });

    await expect(svc.verifyLogin(user, 'ABCD-1234')).rejects.toThrow(
      'Invalid verification code',
    );
    await expect(svc.verifyLogin(user, 'EFGH-5678')).resolves.toBeUndefined();
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});

describe('TwoFactorService hardening', () => {
  it('falls back to JWT_SECRET when TWO_FACTOR_KEY is blank whitespace', async () => {
    const secret = generateSecret();
    const jwtSecret = 'real-jwt-secret-key';
    const prisma: any = {
      user: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          twoFactorEnabled: false,
          twoFactorSecret: sealSecret(secret, jwtSecret),
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const config = {
      get: (k: string) => (k === 'TWO_FACTOR_KEY' ? '   ' : undefined),
      getOrThrow: () => jwtSecret,
    };
    const svc = new TwoFactorService(
      prisma,
      config as never,
      { record: jest.fn() } as never,
    );
    const code = hotp(base32Decode(secret), stepAt(Date.now()));
    const res = await svc.enable('u1', code);
    expect(res.recoveryCodes).toHaveLength(8);
  });

  it('throws BadRequestException instead of 500 when sealed setup secret is corrupted', async () => {
    const { svc, prisma } = setup();
    prisma.user.findUniqueOrThrow.mockResolvedValue({
      twoFactorEnabled: false,
      twoFactorSecret: 'corrupted-ciphertext',
    });
    await expect(svc.enable('u1', '123456')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects concurrent double enable when updateMany matches 0 rows', async () => {
    const { svc, prisma, codeAt } = setup(null, 0);
    prisma.user.findUniqueOrThrow.mockResolvedValue({
      twoFactorEnabled: false,
      twoFactorSecret: sealSecret(generateSecret(), KEY),
    });
    // Use the exact secret from user in setup
    const { svc: s2, prisma: p2, codeAt: c2 } = setup(null, 0);
    const sec = generateSecret();
    p2.user.findUniqueOrThrow.mockResolvedValue({
      twoFactorEnabled: false,
      twoFactorSecret: sealSecret(sec, KEY),
    });
    const code = hotp(base32Decode(sec), stepAt(Date.now()));
    await expect(s2.enable('u1', code)).rejects.toThrow(/already on/);
    expect(svc).toBeDefined();
    expect(prisma).toBeDefined();
    expect(codeAt).toBeDefined();
    expect(c2).toBeDefined();
  });

  it('adminReset forbids non-OWNER from resetting OWNER or ADMINISTRATOR and invalidates session on success', async () => {
    const { svc, prisma, cache } = setup();
    const managerActor: SessionUser = {
      id: 'mgr-1',
      restaurantId: 'r1',
      name: 'Manager',
      roleId: 'role-mgr',
      roleName: 'RESTAURANT_MANAGER',
      permissions: ['users.manage'],
    };
    const ownerActor: SessionUser = {
      id: 'own-1',
      restaurantId: 'r1',
      name: 'Owner',
      roleId: 'role-own',
      roleName: 'OWNER',
      permissions: ['users.manage', 'settings.tax'],
    };

    prisma.user.findFirst.mockResolvedValueOnce({
      id: 'target-own',
      role: { name: 'OWNER', permissions: [] },
    });
    await expect(
      svc.adminReset(managerActor, 'r1', 'target-own'),
    ).rejects.toBeInstanceOf(ForbiddenException);

    prisma.user.findFirst.mockResolvedValueOnce({
      id: 'target-waiter',
      role: { name: 'WAITER', permissions: [] },
    });
    await expect(
      svc.adminReset(ownerActor, 'r1', 'target-waiter'),
    ).resolves.toEqual({ ok: true });
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          permissionsVersion: { increment: 1 },
        }),
      }),
    );
    expect(cache.invalidateUser).toHaveBeenCalledWith('target-waiter');
  });
});
