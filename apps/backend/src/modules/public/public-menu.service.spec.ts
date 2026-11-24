import { PublicMenuService } from './public-menu.service';

describe('PublicMenuService - DPDP Act & Privacy Shield', () => {
  const table = {
    id: 'table-1',
    number: '4',
    name: 'Table 4',
    qrToken: 'test-token',
    assignedWaiterId: 'waiter-1',
    floor: {
      branchId: 'branch-1',
      branch: {
        id: 'branch-1',
        name: 'Main Outlet',
        restaurantId: 'rest-1',
      },
    },
  };

  function buildMocks() {
    const prisma: any = {
      table: {
        findUnique: jest.fn().mockResolvedValue(table),
      },
      customer: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      customerConsent: {
        create: jest.fn().mockResolvedValue({ id: 'consent-1' }),
      },
      order: {
        findFirst: jest.fn(),
      },
      tableRequest: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      userBranch: {
        findFirst: jest.fn().mockResolvedValue({ userId: 'owner-1' }),
      },
      guestBlock: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      qrSettings: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };

    const ordersService: any = {
      createOrder: jest.fn().mockResolvedValue({
        id: 'order-1',
        orderNumber: '20261124-0001',
      }),
      addItems: jest.fn(),
    };

    const notifications: any = {
      createForRole: jest.fn(),
    };

    const realtime: any = {
      emitToBranch: jest.fn(),
    };

    const service = new PublicMenuService(
      prisma,
      ordersService,
      notifications,
      realtime,
    );

    return { service, prisma, ordersService };
  }

  describe('Customer phone deduplication and DPDP consent logging', () => {
    it('creates new customer profile and logs immutable DPDP consent on first order', async () => {
      const { service, prisma, ordersService } = buildMocks();
      prisma.customer.findFirst.mockResolvedValue(null);
      prisma.customer.create.mockResolvedValue({
        id: 'cust-new',
        name: 'Rahul Sharma',
        phone: '9876543210',
        visitCount: 1,
      });

      const result = await service.createOrder(
        'test-token',
        [{ menuItemId: 'item-1', quantity: 2, modifierIds: [] }],
        'Rahul Sharma',
        '9876543210',
        true,
        '103.21.244.2',
        'Mozilla/5.0 (iPhone)',
      );

      expect(prisma.customer.findFirst).toHaveBeenCalledWith({
        where: { branchId: 'branch-1', phone: '9876543210' },
      });
      expect(prisma.customer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            branchId: 'branch-1',
            name: 'Rahul Sharma',
            phone: '9876543210',
            visitCount: 1,
            lastTableNumber: '4',
          }),
        }),
      );
      expect(prisma.customerConsent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          restaurantId: 'rest-1',
          customerId: 'cust-new',
          termsVersion: 'v1.0-2026',
          consentIp: '103.21.244.2',
          userAgent: 'Mozilla/5.0 (iPhone)',
          isAffirmative: true,
          scope: 'BILLING,SERVICE,LOYALTY',
        }),
      });
      expect(ordersService.createOrder).toHaveBeenCalledWith(
        'branch-1',
        'waiter-1',
        expect.objectContaining({
          type: 'QR_ORDER',
          tableId: 'table-1',
          customerId: 'cust-new',
          guestName: 'Rahul Sharma',
        }),
        { channel: 'ONLINE', requireAcceptance: true },
      );
      expect(result).toHaveProperty('orderNumber', '20261124-0001');
    });

    it('blocks order and throws ForbiddenException if phone is in guestBlock list', async () => {
      const { service, prisma } = buildMocks();
      prisma.guestBlock.findFirst.mockResolvedValue({
        id: 'block-1',
        phoneHash: 'blocked-hash',
        reason: 'Abusive spam orders',
      });

      await expect(
        service.createOrder(
          'test-token',
          [{ menuItemId: 'item-1', quantity: 1, modifierIds: [] }],
          'Spammer',
          '9876543210',
          true,
        ),
      ).rejects.toThrow(
        'This mobile number has been restricted from placing online orders.',
      );
    });

    it('rejects order when QR ordering is emergency paused by outlet', async () => {
      const { service, prisma } = buildMocks();
      prisma.qrSettings.findUnique.mockResolvedValue({
        orderingPaused: true,
      });

      await expect(
        service.createOrder(
          'test-token',
          [{ menuItemId: 'item-1', quantity: 1, modifierIds: [] }],
          'Guest',
          '9876543210',
          true,
        ),
      ).rejects.toThrow('QR ordering is temporarily paused by the restaurant.');
    });

    it('enforces maxItemsPerOrder and maxQtyPerLine limits from qrSettings', async () => {
      const { service, prisma } = buildMocks();
      prisma.qrSettings.findUnique.mockResolvedValue({
        orderingPaused: false,
        maxItemsPerOrder: 5,
        maxQtyPerLine: 3,
      });

      // Total count 6 > 5
      await expect(
        service.createOrder(
          'test-token',
          [
            { menuItemId: 'item-1', quantity: 3, modifierIds: [] },
            { menuItemId: 'item-2', quantity: 3, modifierIds: [] },
          ],
          'Guest',
          '9876543210',
          true,
        ),
      ).rejects.toThrow('Order exceeds the maximum limit of 5 items per order.');

      // Single line 4 > 3
      await expect(
        service.createOrder(
          'test-token',
          [{ menuItemId: 'item-1', quantity: 4, modifierIds: [] }],
          'Guest',
          '9876543210',
          true,
        ),
      ).rejects.toThrow('Maximum quantity per item line is 3.');
    });

    it('deduplicates returning customer by phone and increments visitCount', async () => {
      const { service, prisma } = buildMocks();
      const existingCustomer = {
        id: 'cust-existing',
        name: 'Rahul S.',
        phone: '9876543210',
        visitCount: 4,
      };
      prisma.customer.findFirst.mockResolvedValue(existingCustomer);
      prisma.customer.update.mockResolvedValue({
        ...existingCustomer,
        visitCount: 5,
        lastTableNumber: '4',
      });

      await service.createOrder(
        'test-token',
        [{ menuItemId: 'item-1', quantity: 1, modifierIds: [] }],
        'Rahul Sharma',
        '9876543210',
        true,
        '127.0.0.1',
        'Android-Chrome',
      );

      expect(prisma.customer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cust-existing' },
          data: expect.objectContaining({
            name: 'Rahul Sharma',
            visitCount: { increment: 1 },
            lastTableNumber: '4',
          }),
        }),
      );
      expect(prisma.customer.create).not.toHaveBeenCalled();
      expect(prisma.customerConsent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          customerId: 'cust-existing',
          termsVersion: 'v1.0-2026',
        }),
      });
    });
  });

  describe('3-Hour TTL Order Privacy Shield', () => {
    it('returns active order within 3-hour window', async () => {
      const { service, prisma } = buildMocks();
      const activeOrder = {
        orderNumber: '20261124-0042',
        status: 'OPEN',
        acceptance: 'CONFIRMED',
        totalAmount: '450.00',
        createdAt: new Date(),
        items: [{ id: 'item-1', nameSnapshot: 'Paneer Tikka', quantity: 1, status: 'PREPARING' }],
      };
      prisma.order.findFirst.mockResolvedValue(activeOrder);

      const status = await service.getStatus('test-token');

      expect(status.order).toEqual(activeOrder);
      expect(status.expired).toBe(false);
      expect(prisma.order.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tableId: 'table-1',
            status: { in: ['OPEN', 'BILLED'] },
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it('returns expired=true when no order exists within the last 3 hours', async () => {
      const { service, prisma } = buildMocks();
      prisma.order.findFirst.mockResolvedValue(null);

      const status = await service.getStatus('test-token');

      expect(status.order).toBeNull();
      expect(status.expired).toBe(true);
    });
  });
});
