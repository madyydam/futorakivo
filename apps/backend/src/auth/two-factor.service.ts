import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { permissionSatisfied, type SessionUser } from '@futora/types';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service';
import { PermissionsCacheService } from '../permissions/permissions-cache.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  generateRecoveryCode,
  generateSecret,
  openSecret,
  otpauthUrl,
  sealSecret,
  verifyTotp,
} from './totp';

const MAX_FAILURES = 5;
const LOCK_MS = 15 * 60_000;
const RECOVERY_CODES = 8;
const MAX_FAILURE_ENTRIES = 5_000;

interface TwoFactorUser {
  id: string;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  twoFactorRecoveryHashes: string[];
  twoFactorLastStep: number | null;
}

@Injectable()
export class TwoFactorService {
  // Per-user failed-attempt counter (single backend instance). A 6-digit code
  // has only a million values, so guessing must be rate-limited per account,
  // not just per IP.
  private readonly failures = new Map<
    string,
    { count: number; until: number }
  >();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
    @Optional() private readonly cache?: PermissionsCacheService,
  ) {}

  private get keyMaterial() {
    const k = this.config.get<string>('TWO_FACTOR_KEY')?.trim();
    return k ? k : this.config.getOrThrow<string>('JWT_SECRET');
  }

  private assertNotLocked(userId: string) {
    const f = this.failures.get(userId);
    if (f && f.count >= MAX_FAILURES && Date.now() < f.until)
      throw new UnauthorizedException(
        'Too many incorrect codes. Try again in 15 minutes.',
      );
  }

  private fail(userId: string): never {
    const now = Date.now();
    if (this.failures.size >= MAX_FAILURE_ENTRIES && !this.failures.has(userId)) {
      for (const [k, v] of this.failures) {
        if (now >= v.until) this.failures.delete(k);
      }
      if (this.failures.size >= MAX_FAILURE_ENTRIES) {
        const oldest = this.failures.keys().next().value;
        if (oldest !== undefined) this.failures.delete(oldest);
      }
    }
    const f = this.failures.get(userId);
    const fresh = !f || now >= f.until;
    this.failures.set(userId, {
      count: fresh ? 1 : f.count + 1,
      until: now + LOCK_MS,
    });
    throw new UnauthorizedException('Invalid verification code');
  }

  /**
   * Second factor at login: a current authenticator code, or one unused
   * recovery code (consumed on use). Throws if missing or wrong.
   */
  async verifyLogin(user: TwoFactorUser, code: string | undefined) {
    if (!code) throw new UnauthorizedException('TWO_FACTOR_REQUIRED');
    this.assertNotLocked(user.id);
    const trimmed = code.trim();

    if (/^\d{6}$/.test(trimmed) && user.twoFactorSecret) {
      // If the stored secret can no longer be opened (the signing key was
      // changed), treat the code as wrong rather than erroring — recovery
      // codes are hashed separately and still work.
      let plain: string | null = null;
      try {
        plain = openSecret(user.twoFactorSecret, this.keyMaterial);
      } catch {
        plain = null;
      }
      const step = plain ? verifyTotp(plain, trimmed) : null;
      if (step != null && step > (user.twoFactorLastStep ?? 0)) {
        // Atomic: only the request that advances the step wins, so a
        // replayed or concurrently-reused code is rejected.
        const { count } = await this.prisma.user.updateMany({
          where: {
            id: user.id,
            OR: [
              { twoFactorLastStep: null },
              { twoFactorLastStep: { lt: step } },
            ],
          },
          data: { twoFactorLastStep: step },
        });
        if (count === 1) {
          this.failures.delete(user.id);
          return;
        }
      }
      this.fail(user.id);
    }

    if (await this.consumeRecoveryCode(user, trimmed)) {
      this.failures.delete(user.id);
      return;
    }
    this.fail(user.id);
  }

  private async consumeRecoveryCode(user: TwoFactorUser, input: string) {
    const normalised = input.toUpperCase().replace(/[\s-]/g, '');
    const performConsume = async (tx: any): Promise<boolean> => {
      const fresh = tx.user.findUnique
        ? await tx.user.findUnique({
            where: { id: user.id },
            select: { twoFactorRecoveryHashes: true },
          })
        : null;
      const hashes: string[] =
        fresh?.twoFactorRecoveryHashes ?? user.twoFactorRecoveryHashes;

      for (const hash of hashes) {
        if (await bcrypt.compare(normalised, hash)) {
          const { count } = await tx.user.updateMany({
            where: { id: user.id, twoFactorRecoveryHashes: { has: hash } },
            data: {
              twoFactorRecoveryHashes: hashes.filter((h) => h !== hash),
            },
          });
          return count === 1;
        }
      }
      return false;
    };

    return this.prisma.$transaction
      ? this.prisma.$transaction(performConsume)
      : performConsume(this.prisma);
  }

  async status(userId: string) {
    const u = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { twoFactorEnabled: true, twoFactorRecoveryHashes: true },
    });
    return {
      enabled: u.twoFactorEnabled,
      recoveryCodesLeft: u.twoFactorRecoveryHashes.length,
    };
  }

  /** Starts enrolment: stores a pending secret; not active until confirmed. */
  async setup(userId: string) {
    const u = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        email: true,
        name: true,
        twoFactorEnabled: true,
        restaurant: { select: { name: true } },
      },
    });
    if (u.twoFactorEnabled)
      throw new BadRequestException('Two-factor authentication is already on');
    const secret = generateSecret();
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: sealSecret(secret, this.keyMaterial) },
    });
    return {
      secret,
      otpauthUrl: otpauthUrl(secret, u.email ?? u.name, u.restaurant.name),
    };
  }

  /** Confirms enrolment with a first valid code; returns recovery codes once. */
  async enable(userId: string, code: string) {
    const u = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { twoFactorEnabled: true, twoFactorSecret: true },
    });
    if (u.twoFactorEnabled)
      throw new BadRequestException('Two-factor authentication is already on');
    if (!u.twoFactorSecret) throw new BadRequestException('Start setup first');
    this.assertNotLocked(userId);
    let plain: string;
    try {
      plain = openSecret(u.twoFactorSecret, this.keyMaterial);
    } catch {
      throw new BadRequestException(
        'Two-factor setup secret is invalid; please restart setup',
      );
    }
    const step = verifyTotp(plain, code);
    if (step == null) this.fail(userId);

    const codes = Array.from({ length: RECOVERY_CODES }, generateRecoveryCode);
    const hashes = await Promise.all(
      codes.map((c) => bcrypt.hash(c.replace(/-/g, ''), 10)),
    );
    const { count } = await this.prisma.user.updateMany({
      where: { id: userId, twoFactorEnabled: false },
      data: {
        twoFactorEnabled: true,
        twoFactorLastStep: step,
        twoFactorRecoveryHashes: hashes,
      },
    });
    if (count !== 1) {
      throw new BadRequestException('Two-factor authentication is already on');
    }
    this.failures.delete(userId);
    await this.audit.record({
      userId,
      action: '2fa.enabled',
      entity: 'User',
      entityId: userId,
    });
    return { recoveryCodes: codes };
  }

  /** Turning it off needs the password AND a valid code (or recovery code). */
  async disable(userId: string, password: string, code: string) {
    const u = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    if (!u.twoFactorEnabled)
      throw new BadRequestException('Two-factor authentication is not on');
    if (!(await bcrypt.compare(password, u.passwordHash)))
      throw new UnauthorizedException('Incorrect password');
    await this.verifyLogin(u, code);
    await this.clear(userId, false);
    await this.audit.record({
      userId,
      action: '2fa.disabled',
      entity: 'User',
      entityId: userId,
    });
    return { ok: true };
  }

  /** Lets an owner/admin unlock a staff member who lost their device. */
  async adminReset(
    actor: SessionUser,
    restaurantId: string,
    targetUserId: string,
  ) {
    const target = await this.prisma.user.findFirst({
      where: { id: targetUserId, restaurantId },
      select: {
        id: true,
        role: {
          select: {
            name: true,
            permissions: {
              select: { permission: { select: { key: true } } },
            },
          },
        },
      },
    });
    if (!target) throw new BadRequestException('Staff member not found');

    if (
      (target.role.name === 'OWNER' || target.role.name === 'ADMINISTRATOR') &&
      actor.roleName !== 'OWNER'
    ) {
      throw new ForbiddenException(
        `Only an Owner can reset two-factor authentication for ${target.role.name}`,
      );
    }
    const targetKeys = target.role.permissions.map((p) => p.permission.key);
    const missing = targetKeys.filter(
      (k) => !permissionSatisfied(actor.permissions, k),
    );
    if (missing.length > 0) {
      throw new ForbiddenException(
        `Cannot reset two-factor authentication for a user holding permissions you lack: ${missing.join(', ')}`,
      );
    }

    await this.clear(targetUserId, true);
    await this.audit.record({
      userId: actor.id,
      action: '2fa.reset',
      entity: 'User',
      entityId: targetUserId,
    });
    return { ok: true };
  }

  private async clear(userId: string, bumpSession: boolean) {
    this.failures.delete(userId);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorLastStep: null,
        twoFactorRecoveryHashes: [],
        ...(bumpSession ? { permissionsVersion: { increment: 1 } } : {}),
      },
    });
    if (bumpSession && this.cache) {
      this.cache.invalidateUser(userId);
    }
  }
}
