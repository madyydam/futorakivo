import type { NestExpressApplication } from '@nestjs/platform-express';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'node:crypto';
import request from 'supertest';
import { ApprovalsService } from '../../src/approvals/approvals.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  cleanupAuditTenant,
  createAuditApp,
  createRoleViaApi,
  createStaffUserViaApi,
  extractCookie,
  getSuperAdminToken,
  loginViaApi,
  pairDeviceViaApi,
  registerTenantViaApi,
} from './harness';

describe('Phases 0-7 Full Audit Suite against PostgreSQL (e2e-audit)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let approvals: ApprovalsService;
  const createdRestaurants: string[] = [];

  beforeAll(async () => {
    app = await createAuditApp({ throttle: false });
    prisma = app.get(PrismaService);
    approvals = app.get(ApprovalsService);
  });

  afterAll(async () => {
    await prisma.idempotencyKey
      .deleteMany({
        where: { scope: { startsWith: 'add_items:' } },
      })
      .catch(() => undefined);
    for (const restaurantId of createdRestaurants) {
      await cleanupAuditTenant(prisma, restaurantId);
    }
    await app.close();
  });

  it('Phase 1 & 3: canonical permissions (bill.generate_settle -> bills.print, discount.apply_small) & Settings Bistro name preservation', async () => {
    const tenant = await registerTenantViaApi(app, {
      restaurantName: 'Royal Spice Bistro Audit',
    });
    createdRestaurants.push(tenant.restaurantId);
    const server = app.getHttpServer();

    // Settings preserves legitimate restaurant names containing "Bistro"
    const settingsRes = await request(server)
      .get(`/api/v1/settings?branchId=${tenant.branchId}`)
      .set('Cookie', tenant.cookie)
      .expect(200);
    expect(settingsRes.body.restaurant.name).toBe('Royal Spice Bistro Audit');

    // Enforce a 10% cashier discount cap so discount.apply_small vs discount.apply_any is tested
    await prisma.restaurant.update({
      where: { id: tenant.restaurantId },
      data: { maxManualDiscountPercent: 10 },
    });

    // Create floor, table, category, menu item
    const floorRes = await request(server)
      .post(`/api/v1/tables/floors?branchId=${tenant.branchId}`)
      .set('Cookie', tenant.cookie)
      .send({ name: 'Main Dining' })
      .expect(201);

    const tableRes = await request(server)
      .post(`/api/v1/tables?branchId=${tenant.branchId}`)
      .set('Cookie', tenant.cookie)
      .send({ floorId: floorRes.body.id, number: 'T-CANON-1', capacity: 4 })
      .expect(201);

    const catRes = await request(server)
      .post(`/api/v1/menu/categories?branchId=${tenant.branchId}`)
      .set('Cookie', tenant.cookie)
      .send({ name: 'Mains' })
      .expect(201);

    const itemRes = await request(server)
      .post(`/api/v1/menu/items?branchId=${tenant.branchId}`)
      .set('Cookie', tenant.cookie)
      .send({
        categoryId: catRes.body.id,
        name: 'Butter Chicken',
        price: 200,
        taxRatePercent: 0,
      })
      .expect(201);

    // Custom role holding ONLY canonical permissions (no legacy bills.print or discounts.apply)
    const role = await createRoleViaApi(app, tenant.cookie, {
      name: `CANON_CASHIER_${randomUUID().slice(0, 6)}`,
      permissionKeys: [
        'orders.create',
        'order.modify',
        'tables.view',
        'bill.generate_settle',
        'discount.apply_small',
      ],
    });
    const staffEmail = `cashier-${randomUUID().slice(0, 8)}@e2e-audit.local`;
    await createStaffUserViaApi(app, tenant.cookie, {
      name: 'Canonical Cashier',
      email: staffEmail,
      roleId: role.id,
      branchIds: [tenant.branchId],
    });
    const staffLogin = await loginViaApi(app, staffEmail, 'StaffPass123!');
    expect(staffLogin.cookie).toBeTruthy();

    // Staff creates dine-in order
    const orderRes = await request(server)
      .post(`/api/v1/orders?branchId=${tenant.branchId}`)
      .set('Cookie', staffLogin.cookie)
      .send({
        type: 'DINE_IN',
        tableId: tableRes.body.id,
        items: [{ menuItemId: itemRes.body.id, quantity: 1, modifierIds: [] }],
      })
      .expect(201);

    // bill.generate_settle implies bills.print
    await request(server)
      .get(`/api/v1/orders/${orderRes.body.id}/receipt?branchId=${tenant.branchId}`)
      .set('Cookie', staffLogin.cookie)
      .expect(200);

    // Configure a 10% cashier discount cap so 90% requires discount.apply_any
    await prisma.restaurant.update({
      where: { id: tenant.restaurantId },
      data: { maxManualDiscountPercent: 10 },
    });

    // discount.apply_small cannot exceed max cap (90% > 10% without discount.apply_any)
    const highDiscRes = await request(server)
      .post(`/api/v1/orders/${orderRes.body.id}/checkout?branchId=${tenant.branchId}`)
      .set('Cookie', staffLogin.cookie)
      .send({
        discountPercent: 90,
        discountReason: 'Unauthorized huge discount',
        payments: [{ method: 'CASH', amount: 20 }],
      });
    expect([400, 403]).toContain(highDiscRes.status);

    // discount.apply_small allows small 5% discount (200 -> 190)
    const okCheckout = await request(server)
      .post(`/api/v1/orders/${orderRes.body.id}/checkout?branchId=${tenant.branchId}`)
      .set('Cookie', staffLogin.cookie)
      .send({
        discountPercent: 5,
        discountReason: 'Small loyalty courtesy',
        payments: [{ method: 'CASH', amount: 190 }],
      });
    expect([200, 201]).toContain(okCheckout.status);
    expect(okCheckout.body.order?.status ?? okCheckout.body.status).toBe('PAID');
  });

  it('Phase 2 & 3: idempotent addItems, zero lost updates under concurrent addItems, and concurrent partial/full checkout guard', async () => {
    const tenant = await registerTenantViaApi(app);
    createdRestaurants.push(tenant.restaurantId);
    const server = app.getHttpServer();

    const floorRes = await request(server)
      .post(`/api/v1/tables/floors?branchId=${tenant.branchId}`)
      .set('Cookie', tenant.cookie)
      .send({ name: 'Hall Concurrency' })
      .expect(201);

    const tableRes = await request(server)
      .post(`/api/v1/tables?branchId=${tenant.branchId}`)
      .set('Cookie', tenant.cookie)
      .send({ floorId: floorRes.body.id, number: 'T-CONC-1', capacity: 4 })
      .expect(201);

    const catRes = await request(server)
      .post(`/api/v1/menu/categories?branchId=${tenant.branchId}`)
      .set('Cookie', tenant.cookie)
      .send({ name: 'Drinks' })
      .expect(201);

    const itemRes = await request(server)
      .post(`/api/v1/menu/items?branchId=${tenant.branchId}`)
      .set('Cookie', tenant.cookie)
      .send({
        categoryId: catRes.body.id,
        name: 'Cold Brew',
        price: 200,
        taxRatePercent: 0,
      })
      .expect(201);

    // Order 1: initial 200
    const orderRes = await request(server)
      .post(`/api/v1/orders?branchId=${tenant.branchId}`)
      .set('Cookie', tenant.cookie)
      .send({
        type: 'DINE_IN',
        tableId: tableRes.body.id,
        items: [{ menuItemId: itemRes.body.id, quantity: 1, modifierIds: [] }],
      })
      .expect(201);

    const orderId = orderRes.body.id as string;

    // Duplicate addItems with same x-client-request-id -> applied ONCE (+200 => 400)
    const idemKey = `idem-${randomUUID()}`;
    await Promise.all([
      request(server)
        .post(`/api/v1/orders/${orderId}/items?branchId=${tenant.branchId}`)
        .set('Cookie', tenant.cookie)
        .set('x-client-request-id', idemKey)
        .send({
          items: [{ menuItemId: itemRes.body.id, quantity: 1, modifierIds: [] }],
        }),
      request(server)
        .post(`/api/v1/orders/${orderId}/items?branchId=${tenant.branchId}`)
        .set('Cookie', tenant.cookie)
        .set('x-client-request-id', idemKey)
        .send({
          items: [{ menuItemId: itemRes.body.id, quantity: 1, modifierIds: [] }],
        }),
    ]);

    const afterIdem = await request(server)
      .get(`/api/v1/orders/${orderId}?branchId=${tenant.branchId}`)
      .set('Cookie', tenant.cookie)
      .expect(200);
    expect(Number(afterIdem.body.totalAmount)).toBe(400);

    // Two distinct concurrent addItems -> both survive (+200 +200 => 800)
    const [c1, c2] = await Promise.all([
      request(server)
        .post(`/api/v1/orders/${orderId}/items?branchId=${tenant.branchId}`)
        .set('Cookie', tenant.cookie)
        .send({
          items: [{ menuItemId: itemRes.body.id, quantity: 1, modifierIds: [] }],
        }),
      request(server)
        .post(`/api/v1/orders/${orderId}/items?branchId=${tenant.branchId}`)
        .set('Cookie', tenant.cookie)
        .send({
          items: [{ menuItemId: itemRes.body.id, quantity: 1, modifierIds: [] }],
        }),
    ]);
    expect([200, 201]).toContain(c1.status);
    expect([200, 201]).toContain(c2.status);

    const afterConcurrentAdd = await request(server)
      .get(`/api/v1/orders/${orderId}?branchId=${tenant.branchId}`)
      .set('Cookie', tenant.cookie)
      .expect(200);
    expect(Number(afterConcurrentAdd.body.totalAmount)).toBe(800);

    // Two concurrent partial checkouts (500 + 500 on 800 bill) -> max 1 succeeds!
    const [p1, p2] = await Promise.all([
      request(server)
        .post(`/api/v1/orders/${orderId}/checkout?branchId=${tenant.branchId}`)
        .set('Cookie', tenant.cookie)
        .send({
          allowPartial: true,
          payments: [{ method: 'CASH', amount: 500 }],
        }),
      request(server)
        .post(`/api/v1/orders/${orderId}/checkout?branchId=${tenant.branchId}`)
        .set('Cookie', tenant.cookie)
        .send({
          allowPartial: true,
          payments: [{ method: 'CASH', amount: 500 }],
        }),
    ]);
    const partialWins = [p1.status, p2.status].filter(
      (s) => s === 200 || s === 201,
    );
    expect(partialWins).toHaveLength(1);

    const paymentsAfterPartial = await prisma.payment.findMany({
      where: { orderId },
    });
    const totalPaidPartial = paymentsAfterPartial.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );
    expect(totalPaidPartial).toBe(500);

    // Remaining 300 settles cleanly
    const settleRest = await request(server)
      .post(`/api/v1/orders/${orderId}/checkout?branchId=${tenant.branchId}`)
      .set('Cookie', tenant.cookie)
      .send({
        payments: [{ method: 'CASH', amount: 300 }],
      });
    expect([200, 201]).toContain(settleRest.status);

    // Concurrent full checkout on fresh order -> exactly 1 succeeds
    const table2Res = await request(server)
      .post(`/api/v1/tables?branchId=${tenant.branchId}`)
      .set('Cookie', tenant.cookie)
      .send({ floorId: floorRes.body.id, number: 'T-CONC-2', capacity: 4 })
      .expect(201);

    const order2Res = await request(server)
      .post(`/api/v1/orders?branchId=${tenant.branchId}`)
      .set('Cookie', tenant.cookie)
      .send({
        type: 'DINE_IN',
        tableId: table2Res.body.id,
        items: [{ menuItemId: itemRes.body.id, quantity: 1, modifierIds: [] }],
      })
      .expect(201);

    const [f1, f2] = await Promise.all([
      request(server)
        .post(`/api/v1/orders/${order2Res.body.id}/checkout?branchId=${tenant.branchId}`)
        .set('Cookie', tenant.cookie)
        .send({ payments: [{ method: 'CASH', amount: 200 }] }),
      request(server)
        .post(`/api/v1/orders/${order2Res.body.id}/checkout?branchId=${tenant.branchId}`)
        .set('Cookie', tenant.cookie)
        .send({ payments: [{ method: 'CASH', amount: 200 }] }),
    ]);
    const fullWins = [f1.status, f2.status].filter(
      (s) => s === 200 || s === 201,
    );
    expect(fullWins).toHaveLength(1);
    const order2Payments = await prisma.payment.count({
      where: { orderId: order2Res.body.id },
    });
    expect(order2Payments).toBe(1);
  });

  it('Phase 1, 2 & 4: expired pairing code rejected, device PIN login works, cross-tenant waiter assignment rejected, single-use approval token race-safe', async () => {
    const tenantA = await registerTenantViaApi(app);
    const tenantB = await registerTenantViaApi(app);
    createdRestaurants.push(tenantA.restaurantId, tenantB.restaurantId);
    const server = app.getHttpServer();

    // Expired pairing code cannot be paired
    const expiredCode = `EXP${randomUUID().slice(0, 5).toUpperCase()}`;
    await prisma.devicePairingCode.create({
      data: {
        restaurantId: tenantA.restaurantId,
        outletId: tenantA.branchId,
        code: expiredCode,
        createdBy: tenantA.user.id,
        expiresAt: new Date(Date.now() - 60_000),
      },
    });
    const expiredPairRes = await request(server)
      .post('/api/v1/devices/pair')
      .send({ code: expiredCode, label: 'Late Terminal' });
    expect([400, 401, 404]).toContain(expiredPairRes.status);

    // Pair & approve real device, assign PIN, log in on device
    const paired = await pairDeviceViaApi(
      app,
      tenantA.cookie,
      tenantA.branchId,
      'POS Terminal 1',
    );
    if (paired.status !== 'APPROVED') {
      await request(server)
        .post(`/api/v1/devices/${paired.deviceId}/approve`)
        .set('Cookie', tenantA.cookie)
        .expect([200, 201]);
    }

    const mgrPin = '482915';
    await request(server)
      .put('/api/v1/auth/staff-pin')
      .set('Cookie', tenantA.cookie)
      .send({ staffUserId: tenantA.user.id, newPin: mgrPin })
      .expect(200);

    const pinLoginRes = await request(server)
      .post('/api/v1/auth/device-pin-login')
      .set('x-device-token', paired.deviceToken)
      .send({ pin: mgrPin });
    expect([200, 201]).toContain(pinLoginRes.status);
    expect(pinLoginRes.body.user?.id).toBe(tenantA.user.id);

    // Updating staff PIN increments permissionsVersion and invalidates prior sessions
    await request(server)
      .get('/api/v1/auth/me')
      .set('Cookie', tenantA.cookie)
      .expect(401);

    const freshCookie = extractCookie(pinLoginRes)!;
    expect(freshCookie).toBeTruthy();

    // Single-use approval token: concurrent consume allows exactly one winner
    const approvalReq = await request(server)
      .post('/api/v1/approvals/request')
      .set('Cookie', freshCookie)
      .send({
        managerPin: mgrPin,
        permissionKey: 'order.cancel_item',
        targetEntity: 'OrderItem',
        targetId: 'target-item-99',
        reason: 'Guest changed mind before firing',
        changePayload: { b: 2, a: 1 },
      })
      .expect(201);

    const rawApprovalToken = approvalReq.body.approvalToken as string;
    expect(rawApprovalToken).toBeTruthy();

    const [a1, a2] = await Promise.allSettled([
      approvals.consumeApprovalToken(
        tenantA.restaurantId,
        rawApprovalToken,
        'order.cancel_item',
        'target-item-99',
        { a: 1, b: 2 },
      ),
      approvals.consumeApprovalToken(
        tenantA.restaurantId,
        rawApprovalToken,
        'order.cancel_item',
        'target-item-99',
        { a: 1, b: 2 },
      ),
    ]);
    expect([a1, a2].filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect([a1, a2].filter((r) => r.status === 'rejected')).toHaveLength(1);

    // Cross-tenant waiter assignment rejected on PATCH /tables/:id/status
    const floorA = await request(server)
      .post(`/api/v1/tables/floors?branchId=${tenantA.branchId}`)
      .set('Cookie', freshCookie)
      .send({ name: 'Tenant A Floor' })
      .expect(201);
    const tableA = await request(server)
      .post(`/api/v1/tables?branchId=${tenantA.branchId}`)
      .set('Cookie', freshCookie)
      .send({ floorId: floorA.body.id, number: 'T-XT-1', capacity: 4 })
      .expect(201);

    const crossAssignRes = await request(server)
      .patch(`/api/v1/tables/${tableA.body.id}/status?branchId=${tenantA.branchId}`)
      .set('Cookie', freshCookie)
      .send({
        status: 'OCCUPIED',
        assignedWaiterId: tenantB.user.id,
      });
    expect([400, 404]).toContain(crossAssignRes.status);
  });

  it('Phase 5, 6 & 7: normalized GuestBlock, Super Admin JWT isolation + impersonation cookie + killswitch, and Onboarding full flow', async () => {
    const tenant = await registerTenantViaApi(app);
    createdRestaurants.push(tenant.restaurantId);
    const server = app.getHttpServer();

    // Normalized GuestBlock prevents +91 formatted bypass
    const floorRes = await request(server)
      .post(`/api/v1/tables/floors?branchId=${tenant.branchId}`)
      .set('Cookie', tenant.cookie)
      .send({ name: 'Patio' })
      .expect(201);
    const tableRes = await request(server)
      .post(`/api/v1/tables?branchId=${tenant.branchId}`)
      .set('Cookie', tenant.cookie)
      .send({ floorId: floorRes.body.id, number: 'T-QR-1', capacity: 2 })
      .expect(201);
    const catRes = await request(server)
      .post(`/api/v1/menu/categories?branchId=${tenant.branchId}`)
      .set('Cookie', tenant.cookie)
      .send({ name: 'QR Snacks' })
      .expect(201);
    const itemRes = await request(server)
      .post(`/api/v1/menu/items?branchId=${tenant.branchId}`)
      .set('Cookie', tenant.cookie)
      .send({
        categoryId: catRes.body.id,
        name: 'Masala Fries',
        price: 120,
        taxRatePercent: 5,
      })
      .expect(201);

    const qrRes = await request(server)
      .post(`/api/v1/tables/${tableRes.body.id}/qr-token?branchId=${tenant.branchId}`)
      .set('Cookie', tenant.cookie);
    expect([200, 201]).toContain(qrRes.status);
    const qrToken = qrRes.body.qrToken as string;

    await prisma.guestBlock.create({
      data: {
        restaurantId: tenant.restaurantId,
        outletId: tenant.branchId,
        phoneHash: createHash('sha256').update('9876543210').digest('hex'),
        reason: 'Abusive E2E test block',
        blockedBy: tenant.user.id,
      },
    });

    const blockedQrOrder = await request(server)
      .post(`/api/v1/public/menu/${qrToken}/order`)
      .send({
        guestName: 'Formatted Spammer',
        guestPhone: '+91 98765-43210',
        termsAccepted: true,
        items: [{ menuItemId: itemRes.body.id, quantity: 1, modifierIds: [] }],
      });
    expect(blockedQrOrder.status).toBe(403);

    // Super Admin JWT isolation: forged token signed with tenant JWT_SECRET must fail
    const jwtSvc = new JwtService({});
    const forgedToken = jwtSvc.sign(
      { sub: 'fake', email: 'admin@futoragroup.in', role: 'SUPER_ADMIN' },
      { secret: process.env.JWT_SECRET! },
    );
    await request(server)
      .get('/api/v1/super-admin/tenants')
      .set('Authorization', `Bearer ${forgedToken}`)
      .expect(401);

    // Real Super Admin login & prototype plan guard & HttpOnly impersonation cookie
    const saToken = await getSuperAdminToken(app);
    await request(server)
      .patch(`/api/v1/super-admin/tenants/${tenant.restaurantId}/plan`)
      .set('Authorization', `Bearer ${saToken}`)
      .send({ plan: 'constructor' })
      .expect(400);

    const impRes = await request(server)
      .post(`/api/v1/super-admin/impersonate/${tenant.restaurantId}`)
      .set('Authorization', `Bearer ${saToken}`);
    expect([200, 201]).toContain(impRes.status);
    const setCookies = impRes.headers['set-cookie'];
    const cookieList = Array.isArray(setCookies) ? setCookies : [setCookies];
    const impCookie = cookieList.find((c) => c?.startsWith('nodedr_session='));
    expect(impCookie).toBeTruthy();
    expect(impCookie).toMatch(/HttpOnly/i);

    const meAsImp = await request(server)
      .get('/api/v1/auth/me')
      .set('Cookie', extractCookie(impRes)!)
      .expect(200);
    expect(meAsImp.body.user.restaurantId).toBe(tenant.restaurantId);

    // Killswitch revokes regular owner session immediately
    await request(server)
      .post(`/api/v1/super-admin/tenants/${tenant.restaurantId}/killswitch`)
      .set('Authorization', `Bearer ${saToken}`)
      .send({ reason: 'E2E killswitch check' });

    const blockedMe = await request(server)
      .get('/api/v1/auth/me')
      .set('Cookie', tenant.cookie);
    expect([401, 403]).toContain(blockedMe.status);

    // Onboarding wizard: multi-section floor, isVeg:false, MANAGER->RESTAURANT_MANAGER, UserBranch link
    const onboardTenant = await registerTenantViaApi(app, {
      restaurantName: 'Onboarding Verify Kitchen',
    });
    createdRestaurants.push(onboardTenant.restaurantId);

    await request(server)
      .put('/api/v1/onboarding/progress')
      .set('Cookie', onboardTenant.cookie)
      .send({
        currentStep: 11,
        completedStep: 10,
        draftJson: {
          name: 'Onboarding Verify Kitchen',
          tables: [{ name: 'R-01', capacity: 6, section: 'Rooftop' }],
          items: [
            {
              name: 'Mutton Rogan Josh',
              category: 'Mains',
              price: 450,
              tax: 5,
              isVeg: false,
            },
          ],
          staff: [{ name: 'Karan Manager', role: 'MANAGER', pin: '654321' }],
        },
      })
      .expect(200);

    await request(server)
      .post('/api/v1/onboarding/complete')
      .set('Cookie', onboardTenant.cookie)
      .expect([200, 201]);

    const rooftopFloor = await prisma.floor.findFirst({
      where: { branchId: onboardTenant.branchId, name: 'Rooftop' },
    });
    expect(rooftopFloor).toBeTruthy();

    const nonVegItem = await prisma.menuItem.findFirst({
      where: { branchId: onboardTenant.branchId, name: 'Mutton Rogan Josh' },
    });
    expect(nonVegItem?.isVeg).toBe(false);

    const onboardedMgr = await prisma.user.findFirst({
      where: { restaurantId: onboardTenant.restaurantId, name: 'Karan Manager' },
      include: { role: true, branches: true },
    });
    expect(onboardedMgr?.role.name).toBe('RESTAURANT_MANAGER');
    expect(onboardedMgr?.branches.some((b) => b.branchId === onboardTenant.branchId)).toBe(
      true,
    );
  });
});
