import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { ThrottlerStorage } from '@nestjs/throttler';
import type { SessionUser } from '@futora/types';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import request, { type Response as SupertestResponse } from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

export const AUDIT_DATABASE_URL =
  'postgresql://postgres@localhost:5432/kivo_e2e_audit';

const DEFAULT_AUDIT_JWT_SECRET =
  'kivo-e2e-audit-jwt-secret-key-32chars-minimum';

export function assertAuditDatabaseUrl(): string {
  const expected = process.env.E2E_AUDIT_DATABASE_URL || AUDIT_DATABASE_URL;
  let current = process.env.DATABASE_URL;

  if (current && /nodedr_restaurant/i.test(current)) {
    throw new Error(
      `Refusing to boot E2E audit app against dev database (${current}). Set DATABASE_URL=${expected}.`,
    );
  }

  if (!current) {
    current = expected;
    process.env.DATABASE_URL = current;
  } else if (current !== expected && !/kivo_e2e_audit/i.test(current)) {
    throw new Error(
      `Refusing to boot E2E audit app: DATABASE_URL (${current}) does not target kivo_e2e_audit.`,
    );
  }

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim().length < 32) {
    process.env.JWT_SECRET = DEFAULT_AUDIT_JWT_SECRET;
  }

  return current;
}

// Enforce isolation at module load before NestJS ConfigModule loads .env
assertAuditDatabaseUrl();

export interface CreateAuditAppOptions {
  throttle?: boolean;
  rawBody?: boolean;
  superAdminEmail?: string;
  superAdminPassword?: string;
  razorpayKeySecret?: string;
}

export async function createAuditApp(
  opts?: CreateAuditAppOptions,
): Promise<NestExpressApplication> {
  assertAuditDatabaseUrl();

  const envSnapshot: Record<string, string | undefined> = {
    SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL,
    SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  };

  if (opts?.superAdminEmail !== undefined) {
    process.env.SUPER_ADMIN_EMAIL = opts.superAdminEmail;
  }
  if (opts?.superAdminPassword !== undefined) {
    process.env.SUPER_ADMIN_PASSWORD = opts.superAdminPassword;
  }
  if (opts?.razorpayKeySecret !== undefined) {
    process.env.RAZORPAY_KEY_SECRET = opts.razorpayKeySecret;
  }

  try {
    const builder = Test.createTestingModule({
      imports: [AppModule],
    });

    if (opts?.throttle !== true) {
      builder.overrideProvider(ThrottlerStorage).useValue({
        increment: () =>
          Promise.resolve({
            totalHits: 1,
            timeToExpire: 60,
            isBlocked: false,
            timeToBlockExpire: 0,
          }),
      });
    }

    const mod = await builder.compile();
    const app = mod.createNestApplication<NestExpressApplication>({
      rawBody: opts?.rawBody ?? true,
    });

    app.useBodyParser('json', { limit: '100kb' });
    app.use(cookieParser());
    app.enableCors({
      origin: ['http://localhost:1995'],
      credentials: true,
    });
    app.setGlobalPrefix('api', { exclude: [] });

    await app.init();

    const originalClose = app.close.bind(app) as () => Promise<void>;
    app.close = async () => {
      try {
        await originalClose();
      } finally {
        for (const [key, prev] of Object.entries(envSnapshot)) {
          if (prev === undefined) {
            delete process.env[key];
          } else {
            process.env[key] = prev;
          }
        }
      }
    };

    return app;
  } catch (err) {
    for (const [key, prev] of Object.entries(envSnapshot)) {
      if (prev === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = prev;
      }
    }
    throw err;
  }
}

export function extractCookie(
  res: Pick<SupertestResponse, 'headers'>,
  cookieName = 'nodedr_session',
): string | undefined {
  const rawSetCookie = res.headers['set-cookie'] as
    string | string[] | undefined;
  if (!rawSetCookie) return undefined;

  const list = Array.isArray(rawSetCookie) ? rawSetCookie : [rawSetCookie];
  const prefix = `${cookieName}=`;
  for (const entry of list) {
    const firstPart = entry.split(';')[0]?.trim();
    if (firstPart && firstPart.startsWith(prefix)) {
      return firstPart;
    }
  }
  return undefined;
}

export interface RegisterTenantOverrides {
  ownerName?: string;
  email?: string;
  password?: string;
  restaurantName?: string;
  branchName?: string;
}

export interface RegisteredTenant {
  cookie: string;
  user: SessionUser;
  restaurantId: string;
  branchId: string;
  email: string;
  password: string;
}

export async function registerTenantViaApi(
  app: INestApplication<App>,
  overrides?: RegisterTenantOverrides,
): Promise<RegisteredTenant> {
  const tag = randomUUID().slice(0, 8);
  const email = overrides?.email ?? `owner-${tag}@e2e-audit.local`;
  const password = overrides?.password ?? 'AuditPass123!';
  const ownerName = overrides?.ownerName ?? `Audit Owner ${tag}`;
  const restaurantName = overrides?.restaurantName ?? `Audit Bistro ${tag}`;
  const branchName = overrides?.branchName ?? `Main Branch ${tag}`;

  const server = app.getHttpServer();
  const regRes = await request(server).post('/api/v1/auth/register').send({
    ownerName,
    email,
    password,
    restaurantName,
    branchName,
  });

  if (regRes.status !== 201) {
    throw new Error(
      `registerTenantViaApi failed with ${regRes.status}: ${JSON.stringify(regRes.body)}`,
    );
  }

  const cookie = extractCookie(regRes);
  if (!cookie) {
    throw new Error(
      'registerTenantViaApi did not return nodedr_session cookie',
    );
  }

  const body = regRes.body as { user: SessionUser };
  const user = body.user;

  const branchRes = await request(server)
    .get('/api/v1/branches')
    .set('Cookie', cookie);

  if (branchRes.status !== 200) {
    throw new Error(
      `registerTenantViaApi branch lookup failed with ${branchRes.status}: ${JSON.stringify(branchRes.body)}`,
    );
  }

  const branches = branchRes.body as Array<{ id: string; name: string }>;
  const branchId = branches[0]?.id;
  if (!branchId) {
    throw new Error('registerTenantViaApi found no branch for new tenant');
  }

  return {
    cookie,
    user,
    restaurantId: user.restaurantId,
    branchId,
    email,
    password,
  };
}

export interface CreateRoleInput {
  name: string;
  label?: string;
  permissionKeys?: string[];
}

export interface CreatedRole {
  id: string;
  name: string;
  label: string;
  isSystem: boolean;
  permissions: Array<{
    permission: { key: string; label: string; category: string };
  }>;
}

export async function createRoleViaApi(
  app: INestApplication<App>,
  ownerCookie: string,
  data: CreateRoleInput,
): Promise<CreatedRole> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/roles')
    .set('Cookie', ownerCookie)
    .send({
      name: data.name,
      label: data.label ?? data.name,
      permissionKeys: data.permissionKeys ?? [],
    });

  if (res.status !== 201) {
    throw new Error(
      `createRoleViaApi failed with ${res.status}: ${JSON.stringify(res.body)}`,
    );
  }

  return res.body as CreatedRole;
}

export interface CreateStaffUserInput {
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  roleId: string;
  branchIds: string[];
  departmentId?: string | null;
}

export interface CreatedStaffUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  roleId: string;
  password: string;
  role: { id: string; name: string; label: string };
  branches: Array<{ branch: { id: string; name: string } }>;
}

export async function createStaffUserViaApi(
  app: INestApplication<App>,
  ownerCookie: string,
  data: CreateStaffUserInput,
): Promise<CreatedStaffUser> {
  const password = data.password ?? 'StaffPass123!';
  const res = await request(app.getHttpServer())
    .post('/api/v1/users')
    .set('Cookie', ownerCookie)
    .send({
      name: data.name,
      email: data.email,
      phone: data.phone,
      password,
      roleId: data.roleId,
      branchIds: data.branchIds,
      departmentId: data.departmentId,
    });

  if (res.status !== 201) {
    throw new Error(
      `createStaffUserViaApi failed with ${res.status}: ${JSON.stringify(res.body)}`,
    );
  }

  const created = res.body as Omit<CreatedStaffUser, 'password'>;
  return { ...created, password };
}

export interface LoginResult {
  res: SupertestResponse;
  cookie: string;
  user: SessionUser | undefined;
}

export async function loginViaApi(
  app: INestApplication<App>,
  email: string,
  password: string,
  totp?: string,
): Promise<LoginResult> {
  const payload =
    totp !== undefined ? { email, password, totp } : { email, password };
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send(payload);

  const cookie = extractCookie(res) ?? '';
  const body = res.body as { user?: SessionUser } | undefined;
  return {
    res,
    cookie,
    user: body?.user,
  };
}

export interface PairedDevice {
  deviceId: string;
  deviceToken: string;
  status: string;
  label: string;
  outletId: string;
  restaurantId: string;
}

export async function pairDeviceViaApi(
  app: INestApplication<App>,
  ownerCookie: string,
  outletId: string,
  label: string,
): Promise<PairedDevice> {
  const server = app.getHttpServer();
  const codeRes = await request(server)
    .post('/api/v1/devices/pairing-code')
    .set('Cookie', ownerCookie)
    .send({ outletId });

  if (codeRes.status !== 201) {
    throw new Error(
      `pairDeviceViaApi pairing-code failed with ${codeRes.status}: ${JSON.stringify(codeRes.body)}`,
    );
  }

  const { code } = codeRes.body as { code: string };
  const pairRes = await request(server)
    .post('/api/v1/devices/pair')
    .send({ code, label });

  if (pairRes.status !== 201) {
    throw new Error(
      `pairDeviceViaApi pair failed with ${pairRes.status}: ${JSON.stringify(pairRes.body)}`,
    );
  }

  return pairRes.body as PairedDevice;
}

export async function getSuperAdminToken(
  app: INestApplication<App>,
  email?: string,
  password?: string,
): Promise<string> {
  const loginEmail =
    email ?? process.env.SUPER_ADMIN_EMAIL ?? 'admin@futoragroup.in';
  const loginPassword =
    password ?? process.env.SUPER_ADMIN_PASSWORD ?? 'KivokoRoot@2026!';

  const res = await request(app.getHttpServer())
    .post('/api/v1/super-admin/auth/login')
    .send({ email: loginEmail, password: loginPassword });

  if (res.status !== 201) {
    throw new Error(
      `getSuperAdminToken failed with ${res.status}: ${JSON.stringify(res.body)}`,
    );
  }

  const body = res.body as { accessToken?: string };
  if (!body.accessToken) {
    throw new Error('getSuperAdminToken did not return accessToken');
  }

  return body.accessToken;
}

export async function cleanupAuditTenant(
  prisma: PrismaService,
  restaurantId: string,
): Promise<void> {
  if (!restaurantId || restaurantId === 'demo-restaurant') {
    return;
  }

  try {
    await prisma.approvalLog.deleteMany({ where: { restaurantId } });
    await prisma.order.deleteMany({ where: { branch: { restaurantId } } });
    await prisma.qrOrder.deleteMany({ where: { restaurantId } });
    await prisma.stockMovement.deleteMany({
      where: { branch: { restaurantId } },
    });
    await prisma.wasteLog.deleteMany({ where: { branch: { restaurantId } } });
    await prisma.goodsReceipt.deleteMany({
      where: { branch: { restaurantId } },
    });
    await prisma.purchaseOrder.deleteMany({
      where: { branch: { restaurantId } },
    });
    await prisma.supplierPayment.deleteMany({
      where: { branch: { restaurantId } },
    });
    await prisma.supplierInvoice.deleteMany({
      where: { branch: { restaurantId } },
    });
    await prisma.supplierQuotation.deleteMany({
      where: { branch: { restaurantId } },
    });
    await prisma.purchaseRequest.deleteMany({
      where: { branch: { restaurantId } },
    });
    await prisma.stockBatch.deleteMany({
      where: { branch: { restaurantId } },
    });
    await prisma.menuItem.deleteMany({ where: { branch: { restaurantId } } });
    await prisma.ingredient.deleteMany({
      where: { branch: { restaurantId } },
    });
    await prisma.supplier.deleteMany({ where: { branch: { restaurantId } } });
    await prisma.user.deleteMany({ where: { restaurantId } });
    await prisma.restaurant.deleteMany({ where: { id: restaurantId } });
  } catch {
    // Best-effort teardown for isolated audit tenants
  }
}
