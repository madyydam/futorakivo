import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  AUDIT_DATABASE_URL,
  cleanupAuditTenant,
  createAuditApp,
  registerTenantViaApi,
} from './harness';

describe('E2E Audit Harness Smoke (e2e-audit)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const createdRestaurants: string[] = [];

  beforeAll(async () => {
    app = await createAuditApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    for (const restaurantId of createdRestaurants) {
      await cleanupAuditTenant(prisma, restaurantId);
    }
    await app.close();
  });

  it('targets isolated kivo_e2e_audit database and never nodedr_restaurant', () => {
    expect(process.env.DATABASE_URL).toBe(AUDIT_DATABASE_URL);
    expect(process.env.DATABASE_URL).not.toMatch(/nodedr_restaurant/i);
  });

  it('serves GET /api/v1/auth/setup-status with 200', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/setup-status')
      .expect(200);

    const body = res.body as { isSetup: boolean };
    expect(body.isSetup).toBe(true);
  });

  it('provisions and cleans up an isolated audit tenant via opaque-box API', async () => {
    const tenant = await registerTenantViaApi(app);
    createdRestaurants.push(tenant.restaurantId);

    expect(tenant.cookie).toMatch(/^nodedr_session=/);
    expect(tenant.restaurantId).toBeTruthy();
    expect(tenant.branchId).toBeTruthy();

    const meRes = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Cookie', tenant.cookie)
      .expect(200);

    const meBody = meRes.body as { user: { id: string; restaurantId: string } };
    expect(meBody.user.id).toBe(tenant.user.id);
    expect(meBody.user.restaurantId).toBe(tenant.restaurantId);
  });
});
