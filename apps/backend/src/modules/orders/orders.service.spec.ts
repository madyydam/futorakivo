import { BadRequestException, ConflictException } from '@nestjs/common';
import { OrdersService } from './orders.service';

describe('OrdersService - Extended Logic & Safeguards', () => {
  let service: OrdersService;
  let prisma: any;
  let realtime: any;
  let giftCards: any;
  let inventory: any;
  let audit: any;
  let notifications: any;
  let marketing: any;
  let webhooks: any;
  let verifactu: any;
  let referrals: any;
  let orderEvents: any;

  beforeEach(() => {
    prisma = {
      order: {
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
      table: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      branch: {
        findUnique: jest.fn().mockResolvedValue({ id: 'branch-1', restaurantId: 'rest-1' }),
      },
      customer: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      refund: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'ref-1' }),
      },
      pointsLedger: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      orderItem: {
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn(),
      },
      kot: {
        findFirst: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
    };

    realtime = { emitToBranch: jest.fn() };
    giftCards = { debit: jest.fn() };
    inventory = { deductForOrder: jest.fn(), restoreForReturn: jest.fn() };
    audit = { record: jest.fn() };
    notifications = { notifyUser: jest.fn(), notifyByPermission: jest.fn() };
    marketing = { resolveCheckoutDiscount: jest.fn() };
    webhooks = { emitForBranch: jest.fn() };
    verifactu = { recordPaidOrder: jest.fn(), recordRefund: jest.fn() };
    referrals = { recordOrderPoints: jest.fn(), onOrderPaid: jest.fn() };
    orderEvents = { record: jest.fn() };

    service = new OrdersService(
      prisma,
      realtime,
      giftCards,
      inventory,
      audit,
      notifications,
      marketing,
      webhooks,
      verifactu,
      referrals,
      orderEvents,
    );
  });

  describe('updateOrder - Table transfer guards', () => {
    it('refuses to move an order to a table that has an active BILLED order', async () => {
      // Mock editableOrder
      prisma.order.findFirst
        .mockResolvedValueOnce({
          id: 'ord-1',
          branchId: 'branch-1',
          tableId: 'table-1',
          status: 'OPEN',
          type: 'DINE_IN',
          items: [],
          payments: [],
          orderNumber: '20261124-0001',
        })
        // Target table occupant lookup
        .mockResolvedValueOnce({
          orderNumber: '20261124-0002',
          status: 'BILLED',
        });

      prisma.table.findFirst.mockResolvedValue({
        id: 'table-2',
        status: 'OCCUPIED',
      });

      await expect(
        service.updateOrder('branch-1', 'ord-1', 'user-1', {
          tableId: 'table-2',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('refund - Store credit & loyalty clawback safeguards', () => {
    it('refuses store credit refund when order has no attached customer', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 'ord-anon',
        branchId: 'branch-1',
        status: 'PAID',
        customerId: null,
        totalAmount: 500,
      });

      await expect(
        service.refund('branch-1', 'ord-anon', 'user-1', {
          amount: 200,
          reason: 'Customer return',
          method: 'STORE_CREDIT',
        }),
      ).rejects.toThrow(
        'Cannot issue store credit refund for an order without an attached customer',
      );
    });

    it('claws back earned loyalty points proportionally on partial refund', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 'ord-paid',
        branchId: 'branch-1',
        status: 'PAID',
        customerId: 'cust-1',
        totalAmount: 1000,
      });

      prisma.refund.findMany.mockResolvedValue([]);
      prisma.pointsLedger.findFirst.mockResolvedValue({
        delta: 100, // 100 points originally earned
        reason: 'EARN',
      });
      prisma.customer.findUnique.mockResolvedValue({
        loyaltyPoints: 100,
      });

      const res = await service.refund('branch-1', 'ord-paid', 'user-1', {
        amount: 500, // 50% refund -> should claw back 50 points
        reason: 'Faulty item',
        method: 'CASH',
      });

      expect(res.id).toBe('ref-1');
      // Should decrement customer loyalty points by 50
      expect(prisma.customer.update).toHaveBeenCalledWith({
        where: { id: 'cust-1' },
        data: { loyaltyPoints: { decrement: 50 } },
      });
      // Should record a REFUND_REVERSAL pointsLedger row
      expect(prisma.pointsLedger.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          customerId: 'cust-1',
          delta: -50,
          reason: 'REFUND_REVERSAL',
          orderId: 'ord-paid',
        }),
      });
    });
  });

  describe('removeOrderItem - ownership and concurrency guards', () => {
    it('rejects a waiter removing an item from another waiter order', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 'ord-other',
        branchId: 'branch-1',
        status: 'OPEN',
        waiterId: 'waiter-owner',
        items: [
          { id: 'item-1', nameSnapshot: 'Naan', quantity: 1, lineTotal: 50, taxRateSnapshot: 5 },
          { id: 'item-2', nameSnapshot: 'Dal', quantity: 1, lineTotal: 200, taxRateSnapshot: 5 },
        ],
        payments: [],
      });

      await expect(
        service.removeOrderItem(
          'branch-1',
          'ord-other',
          'item-1',
          {
            id: 'waiter-intruder',
            name: 'Intruder',
            restaurantId: 'rest-1',
            roleId: 'role-waiter',
            roleName: 'WAITER',
            permissions: ['order.modify'],
          },
          'Wrong item',
        ),
      ).rejects.toThrow(/assigned waiter or a manager can modify/i);
    });

    it('rejects removing the last item when concurrent removal reduces count to 1', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 'ord-race',
        branchId: 'branch-1',
        status: 'OPEN',
        orderNumber: 'ORD-002',
        waiterId: 'waiter-1',
        items: [
          { id: 'item-1', nameSnapshot: 'Naan', quantity: 1, lineTotal: 50, taxRateSnapshot: 5 },
          { id: 'item-2', nameSnapshot: 'Dal', quantity: 1, lineTotal: 200, taxRateSnapshot: 5 },
        ],
        payments: [],
      });
      prisma.order.update.mockResolvedValue({ id: 'ord-race', status: 'OPEN' });
      (prisma.orderItem as any).count = jest.fn().mockResolvedValue(1);

      await expect(
        service.removeOrderItem('branch-1', 'ord-race', 'item-1', 'waiter-1', 'Cancel last'),
      ).rejects.toThrow('This is the only item - cancel the order instead');
    });
  });

  describe('checkout - Acceptance validation', () => {
    it('refuses to checkout a rejected order', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 'ord-rej',
        branchId: 'branch-1',
        status: 'OPEN',
        acceptance: 'REJECTED',
        items: [],
        payments: [],
      });

      await expect(
        service.checkout('branch-1', 'ord-rej', 'user-1', {
          payments: [{ method: 'CASH', amount: 100 }],
        }),
      ).rejects.toThrow('This order was rejected and cannot be settled');
    });
  });
});
