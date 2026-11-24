import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { DEFAULT_ROLE_PERMISSIONS, STAFF_ROLES } from '@futora/types';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

function safeCompare(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest();
  const hashB = createHash('sha256').update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

export function generate12DigitActivationCode(): string {
  const c1 = randomInt(1000, 10000).toString();
  const c2 = randomInt(1000, 10000).toString();
  const c3 = randomInt(1000, 10000).toString();
  return `${c1}-${c2}-${c3}`;
}

export interface PlatformBroadcast {
  id: string;
  title: string;
  message: string;
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  createdAt: string;
  active: boolean;
}

export class CreateTenantDto {
  restaurantName!: string;
  ownerName!: string;
  email!: string;
  phone?: string;
  city?: string;
  plan?: 'Starter' | 'Growth' | 'Enterprise';
  billingCycle?: 'MONTHLY' | 'YEARLY';
  utrNumber?: string;
  autoApprove?: boolean;
}

@Injectable()
export class SuperAdminService {
  private broadcasts: PlatformBroadcast[] = [
    {
      id: 'bc-1',
      title: 'Scheduled Cloud Maintenance',
      message:
        'Database automated indexing scheduled for Sunday 2:00 AM - 2:30 AM IST. Offline POS mode will maintain uninterrupted local billing.',
      level: 'INFO',
      createdAt: 'Today, 10:00 AM',
      active: true,
    },
    {
      id: 'bc-2',
      title: 'New Feature: Direct Wi-Fi Thermal KOT Printing',
      message:
        'Direct LAN IP printing (80mm/58mm ESC/POS) is now available for all branches on Growth & Enterprise plans.',
      level: 'INFO',
      createdAt: 'Yesterday, 04:30 PM',
      active: true,
    },
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Super Admin authentication with constant-time password comparison and audit trail.
   */
  async login(email: string, password: string, totpCode?: string) {
    const expectedEmail =
      process.env.SUPER_ADMIN_EMAIL || 'admin@futoragroup.in';
    const expectedPassword =
      process.env.SUPER_ADMIN_PASSWORD || 'KivokoRoot@2026!';

    const isEmailValid = safeCompare(
      email.trim().toLowerCase(),
      expectedEmail.toLowerCase(),
    );
    const isPasswordValid = safeCompare(password || '', expectedPassword);

    if (!isEmailValid || !isPasswordValid) {
      await this.audit.record({
        action: 'SUPER_ADMIN_LOGIN_FAILED',
        entity: 'SuperAdmin',
        metadata: {
          attemptedEmail: email,
          timestamp: new Date().toISOString(),
        },
      });
      throw new UnauthorizedException('Invalid Super Admin credentials');
    }

    if (process.env.SUPER_ADMIN_TOTP_SECRET) {
      if (!totpCode || totpCode.trim().length !== 6) {
        throw new BadRequestException('6-Digit TOTP Authenticator code required');
      }
    }

    const payload = {
      email: expectedEmail,
      role: 'SUPER_ADMIN',
      iss: 'kivoko-super-admin',
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: '24h',
      secret: process.env.JWT_SECRET,
    });

    await this.audit.record({
      action: 'SUPER_ADMIN_LOGIN_SUCCESS',
      entity: 'SuperAdmin',
      metadata: {
        email: expectedEmail,
        timestamp: new Date().toISOString(),
      },
    });

    return {
      accessToken: token,
      expiresIn: 86400,
      user: {
        email: expectedEmail,
        role: 'SUPER_ADMIN',
      },
    };
  }

  /**
   * Super Admin Logout audit logging.
   */
  async logout(superAdminEmail: string) {
    await this.audit.record({
      action: 'SUPER_ADMIN_LOGOUT',
      entity: 'SuperAdmin',
      metadata: {
        email: superAdminEmail,
        timestamp: new Date().toISOString(),
      },
    });
    return { success: true };
  }

  /**
   * Cryptographically signed support impersonation ("Login as Tenant").
   * Mints a short-lived 15-minute token scoped to the restaurant owner.
   */
  async impersonateTenant(restaurantId: string, superAdminEmail: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        users: {
          where: { role: { name: 'OWNER' } },
          take: 1,
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant ${restaurantId} not found`);
    }

    const owner = restaurant.users[0];
    if (!owner) {
      throw new BadRequestException('No Owner account attached to this restaurant');
    }

    const token = this.jwtService.sign(
      {
        sub: owner.id,
        email: owner.email,
        restaurantId: restaurant.id,
        role: 'OWNER',
        isImpersonating: true,
        impersonatedBy: superAdminEmail,
      },
      {
        expiresIn: '15m',
        secret: process.env.JWT_SECRET,
      },
    );

    await this.audit.record({
      userId: owner.id,
      action: 'SUPER_ADMIN_IMPERSONATE',
      entity: 'Restaurant',
      entityId: restaurant.id,
      metadata: {
        superAdminEmail,
        restaurantName: restaurant.name,
        expiresIn: '15m',
        timestamp: new Date().toISOString(),
      },
    });

    return {
      token,
      redirectUrl: '/dashboard',
      restaurantName: restaurant.name,
      ownerEmail: owner.email,
    };
  }

  /**
   * Directly provisions a new tenant from Super Admin.
   */
  async createTenant(dto: CreateTenantDto, superAdminEmail: string) {
    if (!dto.restaurantName?.trim() || !dto.email?.trim()) {
      throw new BadRequestException('Restaurant Name and Owner Email are required');
    }

    const branchLimits: Record<string, number> = {
      Starter: 1,
      Growth: 3,
      Enterprise: 100,
    };

    const plan = dto.plan || 'Growth';
    const initialStatus = dto.autoApprove ? 'APPROVED' : 'PENDING_APPROVAL';
    const activationCode = dto.autoApprove
      ? await this.generateUniqueActivationCode()
      : null;

    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email.trim().toLowerCase() },
    });
    if (existingUser) {
      throw new BadRequestException('A user with this email already exists');
    }

    const permissions = await this.prisma.permission.findMany();
    const permissionByKey = new Map(permissions.map((p) => [p.key, p]));

    const result = await this.prisma.$transaction(async (tx) => {
      const restaurant = await tx.restaurant.create({
        data: {
          name: dto.restaurantName.trim(),
          ownerPhone: dto.phone?.trim() || null,
          city: dto.city?.trim() || 'India',
          status: initialStatus,
          plan,
          maxBranches: branchLimits[plan] || 3,
          trialEndsAt: null,
          activationCode,
          isActivated: false,
          activatedAt: null,
          subscriptionExpiresAt: null,
          billingCycle: dto.billingCycle || 'MONTHLY',
          utrNumber: dto.utrNumber?.trim() || null,
        },
      });

      const branch = await tx.branch.create({
        data: {
          restaurantId: restaurant.id,
          name: `${dto.restaurantName.trim()} Main Outlet`,
          phone: dto.phone?.trim() || null,
          address: dto.city?.trim() || null,
        },
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

        const grantedKeys = DEFAULT_ROLE_PERMISSIONS[roleName] || [];
        const rolePermData = grantedKeys
          .map((key) => permissionByKey.get(key))
          .filter((p): p is NonNullable<typeof p> => Boolean(p))
          .map((permission) => ({
            roleId: role.id,
            permissionId: permission.id,
          }));

        if (rolePermData.length > 0) {
          await tx.rolePermission.createMany({ data: rolePermData });
        }
      }

      const tempPassword = `Kivoko@${randomInt(100000, 999999)}`;
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      const user = await tx.user.create({
        data: {
          restaurantId: restaurant.id,
          roleId: ownerRoleId,
          email: dto.email.trim().toLowerCase(),
          name: dto.ownerName?.trim() || 'Owner',
          phone: dto.phone?.trim() || null,
          passwordHash,
        },
      });

      await tx.userBranch.create({
        data: {
          userId: user.id,
          branchId: branch.id,
        },
      });

      return { restaurant, branch, user };
    });

    await this.audit.record({
      action: 'SUPER_ADMIN_CREATE_TENANT',
      entity: 'Restaurant',
      entityId: result.restaurant.id,
      metadata: {
        superAdminEmail,
        restaurantName: result.restaurant.name,
        plan,
        ownerEmail: result.user.email,
        timestamp: new Date().toISOString(),
      },
    });

    return {
      id: result.restaurant.id,
      restaurantName: result.restaurant.name,
      ownerName: result.user.name,
      email: result.user.email,
      phone: result.restaurant.ownerPhone || '',
      city: result.restaurant.city || 'India',
      branchesCount: 1,
      branches: [{ id: result.branch.id, name: result.branch.name, address: result.branch.address }],
      monthlyGmv: '₹0',
      monthlyOrders: 0,
      plan: result.restaurant.plan,
      status: result.restaurant.status,
      activationCode: result.restaurant.activationCode,
      isActivated: result.restaurant.isActivated,
      activatedAt: result.restaurant.activatedAt,
      subscriptionExpiresAt: result.restaurant.subscriptionExpiresAt,
      billingCycle: result.restaurant.billingCycle,
      utrNumber: result.restaurant.utrNumber,
      joinedDate: 'Just now',
    };
  }

  /**
   * Emergency Killswitch / Freeze on a rogue or overdue tenant.
   */
  async killswitchTenant(restaurantId: string, reason: string, superAdminEmail: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const updated = await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        status: 'SUSPENDED',
      },
    });

    await this.audit.record({
      action: 'SUPER_ADMIN_KILLSWITCH',
      entity: 'Restaurant',
      entityId: restaurant.id,
      metadata: {
        superAdminEmail,
        previousStatus: restaurant.status,
        reason: reason || 'Super Admin Killswitch Triggered',
        timestamp: new Date().toISOString(),
      },
    });

    return updated;
  }

  /**
   * Hardware fleet monitoring across all outlets.
   */
  async getHardwareFleet() {
    const devices = await this.prisma.deviceRegistration.findMany({
      include: {
        outlet: {
          select: { id: true, name: true },
        },
        restaurant: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return devices.map((d) => ({
      id: d.id,
      label: d.label,
      status: d.status,
      restaurantName: d.restaurant?.name || 'Unknown Restaurant',
      outletName: d.outlet?.name || 'Main Outlet',
      lastIp: d.lastIp || 'Unknown IP',
      lastSeenAt: d.lastSeenAt,
      createdAt: d.createdAt,
      lockedUntil: d.lockedUntil,
    }));
  }

  /**
   * Remote device revoke / unpair.
   */
  async revokeDevice(deviceId: string, superAdminEmail: string) {
    const device = await this.prisma.deviceRegistration.findUnique({
      where: { id: deviceId },
    });

    if (!device) throw new NotFoundException('Device not found');

    const updated = await this.prisma.deviceRegistration.update({
      where: { id: deviceId },
      data: {
        status: 'REVOKED',
        revokedBy: superAdminEmail,
        revokedAt: new Date(),
      },
    });

    await this.audit.record({
      action: 'SUPER_ADMIN_DEVICE_REVOKE',
      entity: 'DeviceRegistration',
      entityId: device.id,
      metadata: {
        superAdminEmail,
        deviceLabel: device.label,
        timestamp: new Date().toISOString(),
      },
    });

    return updated;
  }

  async getTenants() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const restaurants = await this.prisma.restaurant.findMany({
      include: {
        _count: {
          select: {
            branches: true,
            users: true,
          },
        },
        branches: {
          select: { id: true, name: true, phone: true, address: true, gstNumber: true },
        },
        users: {
          where: { role: { name: 'OWNER' } },
          select: { name: true, email: true, phone: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const results = await Promise.all(
      restaurants.map(async (r) => {
        const orderStats = await this.prisma.order.aggregate({
          where: {
            branch: { restaurantId: r.id },
            createdAt: { gte: thirtyDaysAgo },
            status: { in: ['PAID', 'BILLED'] },
          },
          _sum: { totalAmount: true },
          _count: { _all: true },
        });

        const owner = r.users[0];
        const sumVal = orderStats._sum?.totalAmount;
        const gmv = sumVal ? Number(sumVal) : 0;
        const ordersCount = orderStats._count?._all ?? 0;

        return {
          id: r.id,
          restaurantName: r.name,
          ownerName: owner?.name || 'Owner',
          email: owner?.email || '',
          phone: owner?.phone || r.ownerPhone || '',
          city: r.city || 'India',
          branchesCount: r._count.branches,
          branches: r.branches,
          monthlyGmv: `₹${gmv.toLocaleString('en-IN')}`,
          monthlyOrders: ordersCount,
          plan: (r.plan as 'Starter' | 'Growth' | 'Enterprise') || 'Starter',
          status: (r.status as 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'PENDING_APPROVAL' | 'APPROVED') || 'TRIAL',
          activationCode: r.activationCode,
          isActivated: r.isActivated,
          activatedAt: r.activatedAt,
          subscriptionExpiresAt: r.subscriptionExpiresAt,
          billingCycle: r.billingCycle,
          utrNumber: r.utrNumber,
          trialEndsAt: r.trialEndsAt,
          maxBranches: r.maxBranches,
          currency: r.currency || 'INR',
          upiVpa: r.upiVpa || 'Not configured',
          joinedDate: r.createdAt.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
        };
      }),
    );

    return results;
  }

  async updateTenantStatus(id: string, status: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    return this.prisma.restaurant.update({
      where: { id },
      data: { status },
    });
  }

  async updateTenantPlan(id: string, plan: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const branchLimits: Record<string, number> = {
      Starter: 1,
      Growth: 3,
      Enterprise: 100,
    };

    return this.prisma.restaurant.update({
      where: { id },
      data: {
        plan,
        maxBranches: branchLimits[plan] || 1,
        status: 'ACTIVE',
      },
    });
  }

  async extendTrial(id: string, days: number = 14) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const currentExpiry = restaurant.trialEndsAt ? new Date(restaurant.trialEndsAt) : new Date();
    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + days);

    return this.prisma.restaurant.update({
      where: { id },
      data: {
        trialEndsAt: newExpiry,
        status: 'TRIAL',
      },
    });
  }

  async getPlatformAnalytics() {
    const [totalRestaurants, totalBranches, totalOrdersAgg] = await Promise.all([
      this.prisma.restaurant.count(),
      this.prisma.branch.count(),
      this.prisma.order.aggregate({
        where: { status: { in: ['PAID', 'BILLED'] } },
        _sum: { totalAmount: true },
        _count: { _all: true },
      }),
    ]);

    const activeRestaurants = await this.prisma.restaurant.count({
      where: { status: 'ACTIVE' },
    });

    const trialRestaurants = await this.prisma.restaurant.count({
      where: { status: 'TRIAL' },
    });

    const totalGmvVal = totalOrdersAgg._sum?.totalAmount;
    const mrr = activeRestaurants * 1499 + trialRestaurants * 0;

    return {
      totalRestaurants,
      activeRestaurants,
      trialRestaurants,
      totalBranches,
      mrr: `₹${mrr.toLocaleString('en-IN')}`,
      totalGmv: totalGmvVal ? Number(totalGmvVal) : 0,
      totalOrders: totalOrdersAgg._count?._all ?? 0,
    };
  }

  getPlans() {
    return [
      {
        id: 'plan-starter',
        name: 'Starter',
        priceMonthly: 599,
        priceYearly: 5999,
        currency: 'INR',
        maxBranches: 1,
        features: [
          'Dine-in, Takeaway & Delivery POS',
          'Thermal Bill & KOT Printing (USB/LAN)',
          'UPI QR Dynamic NPCI Payments',
          'Daily Nightly Cash Closing & Report',
          'Offline POS with Auto Cloud Sync',
        ],
        popular: false,
      },
      {
        id: 'plan-growth',
        name: 'Growth',
        priceMonthly: 1499,
        priceYearly: 14999,
        currency: 'INR',
        maxBranches: 3,
        features: [
          'Everything in Starter',
          'Live Kitchen Display System (KDS)',
          'Contactless Table QR Ordering',
          'Recipe Management & Ingredient Costing',
          'Staff Attendance & Clock-In Payroll',
          'Zomato & Swiggy Order Relay',
        ],
        popular: true,
      },
      {
        id: 'plan-enterprise',
        name: 'Enterprise',
        priceMonthly: 3999,
        priceYearly: 39999,
        currency: 'INR',
        maxBranches: 100,
        features: [
          'Everything in Growth',
          'Unlimited Outlets & Central Kitchen Hub',
          'Inter-Branch Stock Indents & Transfers',
          'Consolidated Brand P&L Analytics',
          'WhatsApp Automated Marketing Campaigns',
          'Dedicated Account Manager & 24/7 SLA',
        ],
        popular: false,
      },
    ];
  }

  getBroadcasts() {
    return this.broadcasts;
  }

  createBroadcast(
    title: string,
    message: string,
    level: 'INFO' | 'WARNING' | 'CRITICAL',
  ) {
    const item: PlatformBroadcast = {
      id: `bc-${Date.now()}`,
      title,
      message,
      level,
      createdAt: 'Just now',
      active: true,
    };
    this.broadcasts.unshift(item);
    return item;
  }

  /**
   * Helper to generate a unique 12-digit activation code without collision.
   */
  async generateUniqueActivationCode(): Promise<string> {
    let code = generate12DigitActivationCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await this.prisma.restaurant.findFirst({
        where: { activationCode: code },
        select: { id: true },
      });
      if (!existing) return code;
      code = generate12DigitActivationCode();
      attempts++;
    }
    return code;
  }

  /**
   * Approves a restaurant tenant after payment confirmation and generates
   * a cryptographically random 12-digit license activation code (4-4-4).
   * Subscription timer DOES NOT start yet — it begins strictly upon owner activation!
   */
  async approveTenant(restaurantId: string, superAdminEmail: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const activationCode = await this.generateUniqueActivationCode();

    const updated = await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        status: 'APPROVED',
        activationCode,
        isActivated: false,
        activatedAt: null,
        subscriptionExpiresAt: null,
      },
    });

    await this.audit.record({
      action: 'SUPER_ADMIN_APPROVE_TENANT',
      entity: 'Restaurant',
      entityId: restaurant.id,
      metadata: {
        superAdminEmail,
        restaurantName: restaurant.name,
        activationCode,
        timestamp: new Date().toISOString(),
      },
    });

    return {
      id: updated.id,
      status: updated.status,
      activationCode: updated.activationCode,
      message: 'Restaurant approved. 12-digit activation code generated.',
    };
  }

  /**
   * Activates a restaurant license using the 12-digit code (4-4-4).
   * Exact moment of activation STARTS the subscription period (30 days / 365 days).
   */
  async activateLicense(rawCode: string) {
    if (!rawCode) {
      throw new BadRequestException('12-digit activation code is required');
    }

    const clean = rawCode.replace(/[^0-9]/g, '');
    if (clean.length !== 12) {
      throw new BadRequestException('Invalid format: code must be exactly 12 digits');
    }

    const formatted = `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8, 12)}`;

    // Find restaurant with matching code
    const restaurant = await this.prisma.restaurant.findFirst({
      where: {
        OR: [
          { activationCode: formatted },
          { activationCode: clean },
        ],
      },
      include: {
        branches: { take: 1 },
      },
    });

    if (!restaurant) {
      throw new BadRequestException('Invalid or unapproved activation code. Please check or contact Super Admin.');
    }

    if (restaurant.isActivated) {
      throw new BadRequestException(
        `This activation code was already redeemed on ${restaurant.activatedAt?.toLocaleDateString('en-IN') || 'earlier'}.`,
      );
    }

    if (restaurant.status === 'SUSPENDED') {
      throw new BadRequestException('This restaurant account has been suspended by Super Admin.');
    }

    const now = new Date();
    const expiresAt = new Date(now);
    if (restaurant.billingCycle === 'YEARLY') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setDate(expiresAt.getDate() + 30); // 30-day billing cycle
    }

    const updateResult = await this.prisma.restaurant.updateMany({
      where: {
        id: restaurant.id,
        isActivated: false,
      },
      data: {
        status: 'ACTIVE',
        isActivated: true,
        activatedAt: now,
        subscriptionExpiresAt: expiresAt,
        trialEndsAt: null,
      },
    });

    if (updateResult.count === 0) {
      throw new BadRequestException(
        'License activation race condition: this license has already been activated.',
      );
    }

    const updated = await this.prisma.restaurant.findUniqueOrThrow({
      where: { id: restaurant.id },
    });

    await this.audit.record({
      action: 'RESTAURANT_LICENSE_ACTIVATED',
      entity: 'Restaurant',
      entityId: restaurant.id,
      metadata: {
        restaurantName: restaurant.name,
        activatedAt: now.toISOString(),
        subscriptionExpiresAt: expiresAt.toISOString(),
        plan: restaurant.plan,
      },
    });

    return {
      success: true,
      message: 'Restaurant license successfully activated!',
      restaurantId: updated.id,
      restaurantName: updated.name,
      plan: updated.plan,
      status: updated.status,
      activatedAt: now.toISOString(),
      subscriptionExpiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * Real-time system health metrics: DB query latency, memory RSS, heap, uptime, and active tenant counters.
   */
  async getSystemHealth() {
    const dbStart = Date.now();
    await this.prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - dbStart;

    const mem = process.memoryUsage();
    const [totalRestaurants, activeRestaurants, approvedPendingActivation, suspendedRestaurants] = await Promise.all([
      this.prisma.restaurant.count(),
      this.prisma.restaurant.count({ where: { status: 'ACTIVE' } }),
      this.prisma.restaurant.count({ where: { status: 'APPROVED', isActivated: false } }),
      this.prisma.restaurant.count({ where: { status: 'SUSPENDED' } }),
    ]);

    return {
      status: 'HEALTHY',
      timestamp: new Date().toISOString(),
      database: {
        status: 'CONNECTED',
        latencyMs: dbLatencyMs,
        provider: 'PostgreSQL',
      },
      process: {
        uptimeSeconds: Math.floor(process.uptime()),
        nodeVersion: process.version,
        memoryHeapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        memoryHeapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
        memoryRssMb: Math.round(mem.rss / 1024 / 1024),
      },
      fleet: {
        totalRestaurants,
        activeRestaurants,
        approvedPendingActivation,
        suspendedRestaurants,
      },
    };
  }

  /**
   * Live platform audit logs stream.
   */
  async getAuditLogs(limit: number = 50) {
    const logs = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      metadata: log.metadata,
      createdAt: log.createdAt,
      userName: log.user?.name || 'System / Super Admin',
      userEmail: log.user?.email || null,
    }));
  }
}
