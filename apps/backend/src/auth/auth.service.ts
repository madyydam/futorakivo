import {
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DeviceStatus, Prisma } from '@prisma/client';
import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSIONS,
  permissionSatisfied,
  STAFF_ROLES,
  type LoginDto,
  type PinLoginDto,
  type RegisterDto,
  type SessionUser,
  type UpdateStaffPinDto,
} from '@futora/types';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { TwoFactorService } from './two-factor.service';
import { PinHasherService } from './pin-hasher.service';
import { DevicesService } from '../devices/devices.service';
import { PermissionsCacheService } from '../permissions/permissions-cache.service';
import {
  effectivePermissions,
  permissionInclude,
  type PermissionSource,
} from './effective-permissions';

const PIN_MAX_FAILURES = 5;
const PIN_LOCK_MS = 15 * 60_000;
const PIN_MAX_TRACKED_USERS = 5_000;

@Injectable()
export class AuthService {
  private readonly pinFailures = new Map<
    string,
    { count: number; until: number }
  >();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly twoFactor: TwoFactorService,
    private readonly pinHasher: PinHasherService,
    private readonly devices: DevicesService,
    @Optional() private readonly cache?: PermissionsCacheService,
    @Optional() private readonly audit?: AuditService,
  ) {}

  private toSessionUser(user: {
    id: string;
    restaurantId: string;
    name: string;
    roleId: string;
    role: { name: string; permissions: { permission: { key: string } }[] };
    permissionOverrides?: PermissionSource['permissionOverrides'];
    permissionsVersion?: number;
  }): SessionUser {
    return {
      id: user.id,
      restaurantId: user.restaurantId,
      name: user.name,
      roleId: user.roleId,
      roleName: user.role.name,
      permissions: effectivePermissions(user),
      permissionsVersion: user.permissionsVersion ?? 1,
    };
  }

  /**
   * Delete my own account (an app-store requirement). The person's details are
   * erased and the login closed; order and payment rows that point at the user
   * stay, because tax records must be kept. The last active owner cannot do
   * this, or the restaurant would be locked out.
   */
  async deleteOwnAccount(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Password is incorrect');
    }
    if (user.role.name === 'OWNER') {
      const otherOwners = await this.prisma.user.count({
        where: {
          restaurantId: user.restaurantId,
          isActive: true,
          id: { not: user.id },
          role: { name: 'OWNER' },
        },
      });
      if (otherOwners === 0) {
        throw new ConflictException(
          'You are the only owner. Make someone else an owner first, or contact support to close the restaurant.',
        );
      }
    }
    const scrambled = await bcrypt.hash(
      `${userId}:${Date.now()}:${Math.random()}`,
      10,
    );
    await this.prisma.$transaction([
      this.prisma.deviceToken.deleteMany({ where: { userId } }),
      this.prisma.notification.deleteMany({
        where: { recipientUserId: userId },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          name: 'Deleted user',
          email: null,
          phone: null,
          passwordHash: scrambled,
          pinHash: null,
          pinLookup: null,
          pepperKeyId: null,
          permissionsVersion: { increment: 1 },
          isActive: false,
          riderOnline: false,
          riderLat: null,
          riderLng: null,
          riderLocationAt: null,
          dashboardPrefs: Prisma.JsonNull,
          twoFactorSecret: null,
          twoFactorEnabled: false,
          twoFactorRecoveryHashes: [],
        },
      }),
    ]);
    this.cache?.invalidateUser(userId);
    await this.audit?.record({
      userId,
      action: 'user.self_deleted',
      entity: 'User',
      entityId: userId,
      metadata: { restaurantId: user.restaurantId },
    });
    return { ok: true };
  }

  private assertRestaurantActive(
    restaurant:
      | {
          status: string;
          isActivated?: boolean;
          subscriptionExpiresAt?: Date | null;
        }
      | null
      | undefined,
  ) {
    if (!restaurant) return;
    if (restaurant.status === 'SUSPENDED') {
      throw new UnauthorizedException(
        'This restaurant account has been suspended by Super Admin.',
      );
    }
    if (restaurant.status === 'PENDING_APPROVAL') {
      throw new UnauthorizedException(
        'Your restaurant registration is currently pending Super Admin approval. Please wait for approval.',
      );
    }
    if (restaurant.status === 'APPROVED' && !restaurant.isActivated) {
      throw new UnauthorizedException(
        'Your restaurant has been approved! Please enter your 12-digit activation code on the activation page to start your subscription.',
      );
    }
    if (
      restaurant.subscriptionExpiresAt &&
      restaurant.subscriptionExpiresAt < new Date() &&
      restaurant.status === 'ACTIVE'
    ) {
      throw new UnauthorizedException(
        'Your subscription has expired. Please contact Super Admin to renew your license.',
      );
    }
  }

  async login(dto: LoginDto) {
    const include = permissionInclude;
    const id = dto.email.trim();
    let user: Awaited<ReturnType<typeof this.findLoginCandidate>> = null;
    // An email address, or a phone number as the login ID (delivery riders).
    // Every failure gives the same message so nothing reveals which IDs exist.
    if (id.includes('@')) {
      const normalizedEmail = id.toLowerCase();
      const candidates = await this.prisma.user.findMany({
        where: {
          email: { equals: normalizedEmail, mode: 'insensitive' },
          isActive: true,
        },
        include,
        take: 10,
      });
      for (const u of candidates) {
        if (await bcrypt.compare(dto.password, u.passwordHash)) {
          user = u;
          break;
        }
      }
    } else {
      user = await this.findLoginCandidate(id, dto.password);
    }
    if (!user) {
      // Spend comparable cost-12 time when the ID is unknown, so timing does not reveal it.
      await this.pinHasher.verifyPin(dto.password, null);
      throw new UnauthorizedException('Invalid login ID or password');
    }

    if (user.restaurantId) {
      const restaurant = await this.prisma.restaurant?.findUnique?.({
        where: { id: user.restaurantId },
        select: { status: true, isActivated: true, subscriptionExpiresAt: true },
      });
      this.assertRestaurantActive(restaurant);
    }

    // Only asked for after the password is right, so the response never
    // reveals which emails exist or which accounts use two-factor.
    if (user.twoFactorEnabled) {
      await this.twoFactor.verifyLogin(user, dto.totp);
    }

    return this.issueSession(user);
  }

  /** Phone-number login: compare real digits, then the password, against every active match. */
  private async findLoginCandidate(id: string, password: string) {
    const tail = id.replace(/\D/g, '').slice(-10);
    if (tail.length < 6) return null;
    const candidates = await this.prisma.user.findMany({
      where: { isActive: true, phone: { endsWith: tail.slice(-6) } },
      include: permissionInclude,
      take: 10,
    });
    for (const u of candidates) {
      if ((u.phone ?? '').replace(/\D/g, '').slice(-10) !== tail) continue;
      if (await bcrypt.compare(password, u.passwordHash)) return u;
    }
    return null;
  }

  async register(dto: RegisterDto) {
    // Cloud SaaS Architecture (Petpooja-style): Public signup is enabled by default
    // so any restaurant owner can register their outlet online.
    if (
      process.env.ALLOW_PUBLIC_SIGNUP === 'false' &&
      (await this.hasAnyRestaurant())
    ) {
      throw new ForbiddenException(
        'Sign-up is currently disabled on this server.',
      );
    }
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    });
    if (existing) {
      throw new BadRequestException(
        'An account with this email already exists',
      );
    }

    // Permissions are global, not per-tenant — upsert (idempotent) outside
    // the transaction below rather than re-creating them per restaurant.
    for (const permission of PERMISSIONS) {
      await this.prisma.permission.upsert({
        where: { key: permission.key },
        update: {},
        create: permission,
      });
    }
    const allPermissions = await this.prisma.permission.findMany();
    const permissionByKey = new Map(allPermissions.map((p) => [p.key, p]));

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const owner = await this.prisma.$transaction(async (tx) => {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14-day free trial like Petpooja

      const restaurant = await tx.restaurant.create({
        data: {
          name: dto.restaurantName,
          status: 'TRIAL',
          plan: 'Starter',
          trialEndsAt,
          maxBranches: 1,
        },
      });
      const branch = await tx.branch.create({
        data: { restaurantId: restaurant.id, name: dto.branchName },
      });

      let ownerRoleId = '';
      for (const roleName of STAFF_ROLES) {
        const role = await tx.role.create({
          data: {
            restaurantId: restaurant.id,
            name: roleName,
            label: roleName.replace(/_/g, ' '),
          },
        });
        if (roleName === 'OWNER') ownerRoleId = role.id;

        const grantedKeys = DEFAULT_ROLE_PERMISSIONS[roleName];
        await tx.rolePermission.createMany({
          data: grantedKeys
            .map((key) => permissionByKey.get(key))
            .filter((p): p is NonNullable<typeof p> => Boolean(p))
            .map((permission) => ({
              roleId: role.id,
              permissionId: permission.id,
            })),
        });
      }

      const user = await tx.user.create({
        data: {
          restaurantId: restaurant.id,
          roleId: ownerRoleId,
          name: dto.ownerName,
          email: normalizedEmail,
          passwordHash,
        },
        include: permissionInclude,
      });

      await tx.userBranch.create({
        data: { userId: user.id, branchId: branch.id },
      });

      return user;
    });

    return this.issueSession(owner);
  }

  async hasAnyRestaurant(): Promise<boolean> {
    const restaurant = await this.prisma.restaurant.findFirst({
      select: { id: true },
    });
    return restaurant !== null;
  }

  private assertPinNotLocked(userId: string) {
    const f = this.pinFailures.get(userId);
    if (f && f.count >= PIN_MAX_FAILURES && Date.now() < f.until) {
      throw new UnauthorizedException(
        'Too many incorrect PIN attempts. Try again in 15 minutes.',
      );
    }
  }

  private recordPinFailure(userId: string) {
    const now = Date.now();
    if (
      this.pinFailures.size >= PIN_MAX_TRACKED_USERS &&
      !this.pinFailures.has(userId)
    ) {
      for (const [k, v] of this.pinFailures) {
        if (now >= v.until) this.pinFailures.delete(k);
      }
      if (this.pinFailures.size >= PIN_MAX_TRACKED_USERS) {
        const oldest = this.pinFailures.keys().next().value;
        if (oldest !== undefined) this.pinFailures.delete(oldest);
      }
    }
    const f = this.pinFailures.get(userId);
    const fresh = !f || now >= f.until;
    this.pinFailures.set(userId, {
      count: fresh ? 1 : f.count + 1,
      until: now + PIN_LOCK_MS,
    });
  }

  async pinLogin(dto: PinLoginDto) {
    this.assertPinNotLocked(dto.userId);

    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      include: permissionInclude,
    });

    if (!user || !user.isActive || !user.pinHash) {
      await this.pinHasher.verifyPin(dto.pin, null);
      this.recordPinFailure(dto.userId);
      throw new UnauthorizedException('PIN login not available for this user');
    }

    if (user.restaurantId) {
      const restaurant = await this.prisma.restaurant?.findUnique?.({
        where: { id: user.restaurantId },
        select: { status: true, isActivated: true, subscriptionExpiresAt: true },
      });
      this.assertRestaurantActive(restaurant);
    }

    // A 4-8 digit PIN must not be a way around the second factor.
    if (user.twoFactorEnabled) {
      throw new UnauthorizedException(
        'PIN login is off for accounts with two-factor authentication — sign in with your password',
      );
    }

    const valid = await this.pinHasher.verifyPin(dto.pin, user.pinHash);
    if (!valid) {
      this.recordPinFailure(dto.userId);
      throw new UnauthorizedException('Incorrect PIN');
    }

    this.pinFailures.delete(dto.userId);
    return this.issueSession(user);
  }

  /**
   * High-concurrency POS terminal PIN login.
   * Validates device approval, enforces 5-fail 15-minute lockout,
   * performs indexed HMAC lookup + bcrypt verification, and issues JWT bound to device.
   */
  async devicePinLogin(
    rawDeviceToken: string,
    pin: string,
    ip = '127.0.0.1',
  ) {
    if (!rawDeviceToken) {
      throw new UnauthorizedException('Device token is required');
    }

    const device = await this.devices.verifyDeviceToken(rawDeviceToken);
    if (!device || device.status !== DeviceStatus.APPROVED) {
      throw new UnauthorizedException('Device is not registered or approved');
    }

    const deviceRestaurant =
      (device as any).restaurant ??
      (await this.prisma.restaurant?.findUnique?.({
        where: { id: device.restaurantId },
        select: { status: true, isActivated: true, subscriptionExpiresAt: true },
      }));
    this.assertRestaurantActive(deviceRestaurant);

    if (device.lockedUntil && device.lockedUntil > new Date()) {
      const waitMinutes = Math.ceil(
        (device.lockedUntil.getTime() - Date.now()) / (60 * 1000),
      );
      throw new UnauthorizedException(
        `Device is temporarily locked due to repeated incorrect PIN attempts. Try again in ${waitMinutes} minute(s).`,
      );
    }

    const pinLookup = this.pinHasher.computeLookup(device.restaurantId, pin);
    const user = await this.prisma.user.findFirst({
      where: {
        restaurantId: device.restaurantId,
        pinLookup,
        isActive: true,
      },
      include: permissionInclude,
    });

    const isPinValid = await this.pinHasher.verifyPin(pin, user?.pinHash);

    if (!isPinValid || !user) {
      const now = new Date();
      const recordFailure = async (tx: any): Promise<number> => {
        await tx.pinAttempt.create({
          data: {
            restaurantId: device.restaurantId,
            deviceId: device.id,
            ip,
            success: false,
          },
        });

        if (device.lockedUntil && device.lockedUntil <= now) {
          const reset = await tx.deviceRegistration.updateMany({
            where: { id: device.id, lockedUntil: { lte: now } },
            data: {
              failedAttempts: 1,
              lockedUntil: null,
              lastIp: ip,
              lastSeenAt: now,
            },
          });
          if (reset.count === 1) {
            return 1;
          }
        }

        const updated = await tx.deviceRegistration.update({
          where: { id: device.id },
          data: {
            failedAttempts: { increment: 1 },
            lastIp: ip,
            lastSeenAt: now,
          },
          select: { failedAttempts: true },
        });
        const nextCount = updated?.failedAttempts ?? (device.failedAttempts ?? 0) + 1;
        if (nextCount >= 5) {
          await tx.deviceRegistration.update({
            where: { id: device.id },
            data: {
              lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
            },
          });
        }
        return nextCount;
      };

      const failedAttempts = this.prisma.$transaction
        ? await this.prisma.$transaction(recordFailure)
        : await recordFailure(this.prisma);

      if (failedAttempts >= 5) {
        throw new UnauthorizedException(
          'Too many failed attempts. Device locked for 15 minutes.',
        );
      }
      throw new UnauthorizedException('Incorrect PIN');
    }

    if (user.twoFactorEnabled) {
      throw new UnauthorizedException(
        'PIN login is disabled for accounts with two-factor authentication — please sign in with your password',
      );
    }

    // Record success
    await this.prisma.pinAttempt.create({
      data: {
        restaurantId: device.restaurantId,
        deviceId: device.id,
        ip,
        success: true,
      },
    });

    // Reset failed counter and refresh last seen
    await this.prisma.deviceRegistration.update({
      where: { id: device.id },
      data: {
        failedAttempts: 0,
        lockedUntil: null,
        lastSeenAt: new Date(),
        lastIp: ip,
      },
    });

    const sessionUser = this.toSessionUser(user);
    const token = await this.jwt.signAsync({
      sub: user.id,
      restaurantId: user.restaurantId,
      deviceId: device.id,
      outletId: device.outletId,
      pv: user.permissionsVersion ?? 1,
    });

    return {
      token,
      user: sessionUser,
      mustChangePin: Boolean(user.mustChangePin),
    };
  }

  /**
   * Sets or updates staff PIN with uniqueness verification within the restaurant.
   */
  async updateStaffPin(
    restaurantId: string,
    actor: SessionUser,
    dto: UpdateStaffPinDto,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id: dto.staffUserId, restaurantId },
      include: {
        role: {
          include: {
            permissions: { include: { permission: { select: { key: true } } } },
          },
        },
      },
    });
    if (!user) {
      throw new NotFoundException('Staff member not found');
    }

    if (
      (user.role?.name === 'OWNER' || user.role?.name === 'ADMINISTRATOR') &&
      actor.roleName !== 'OWNER'
    ) {
      throw new ForbiddenException(
        `Only an Owner can update the PIN for ${user.role.name}`,
      );
    }
    const targetKeys = (user.role?.permissions ?? []).map(
      (rp) => rp.permission.key,
    );
    const missing = targetKeys.filter(
      (k) => !permissionSatisfied(actor.permissions, k),
    );
    if (missing.length > 0) {
      throw new ForbiddenException(
        `Cannot update PIN for a user holding permissions you lack: ${missing.join(', ')}`,
      );
    }

    const pinLookup = this.pinHasher.computeLookup(restaurantId, dto.newPin);

    // Prevent duplicate PIN collisions within the same restaurant
    const conflict = await this.prisma.user.findFirst({
      where: {
        restaurantId,
        pinLookup,
        id: { not: dto.staffUserId },
        isActive: true,
      },
    });
    if (conflict) {
      throw new ConflictException(
        'This PIN is already assigned to another staff member at this restaurant',
      );
    }

    const pinHash = await this.pinHasher.hashPin(dto.newPin);

    await this.prisma.user.update({
      where: { id: dto.staffUserId },
      data: {
        pinLookup,
        pinHash,
        pepperKeyId: 'v1',
        mustChangePin: false,
        permissionsVersion: { increment: 1 },
      },
    });

    if (this.cache) {
      this.cache.invalidateUser(dto.staffUserId);
    }

    await this.audit?.record({
      userId: actor.id,
      action: 'staff.pin_updated',
      entity: 'User',
      entityId: dto.staffUserId,
      metadata: { restaurantId },
    });

    return { success: true, message: 'PIN updated successfully' };
  }

  private async issueSession(
    user: Parameters<AuthService['toSessionUser']>[0],
  ) {
    const sessionUser = this.toSessionUser(user);
    const token = await this.jwt.signAsync({
      sub: user.id,
      restaurantId: user.restaurantId,
      pv: user.permissionsVersion ?? 1,
    });
    return { token, user: sessionUser };
  }
}
