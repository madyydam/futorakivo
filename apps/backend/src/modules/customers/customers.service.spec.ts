import { NotFoundException } from '@nestjs/common';
import { CustomersService } from './customers.service';

describe('CustomersService - CRM History & DPDP Consent Audit', () => {
  function buildMocks() {
    const prisma: any = {
      customer: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      order: {
        findMany: jest.fn(),
      },
      customerConsent: {
        findMany: jest.fn(),
      },
    };

    const service = new CustomersService(prisma);
    return { service, prisma };
  }

  describe('list', () => {
    it('includes orders and consents in the query for CRM display', async () => {
      const { service, prisma } = buildMocks();
      prisma.customer.findMany.mockResolvedValue([
        {
          id: 'cust-1',
          name: 'Priya Patel',
          phone: '9876543211',
          visitCount: 3,
          orders: [{ totalAmount: '500.00' }, { totalAmount: '750.00' }],
          consents: [{ termsVersion: 'v1.0-2026' }],
        },
      ]);

      const result = await service.list('branch-1');

      expect(prisma.customer.findMany).toHaveBeenCalledWith({
        where: { branchId: 'branch-1' },
        include: {
          orders: {
            where: { status: 'PAID' },
            select: { totalAmount: true },
          },
          consents: {
            orderBy: { consentedAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('getHistory', () => {
    it('retrieves full order history with items, modifiers, table, and payments', async () => {
      const { service, prisma } = buildMocks();
      prisma.customer.findFirst.mockResolvedValue({ id: 'cust-1', branchId: 'branch-1' });
      prisma.order.findMany.mockResolvedValue([
        {
          id: 'order-1',
          orderNumber: '20261124-0010',
          totalAmount: '1200.00',
          table: { id: 'table-1', number: '4', name: 'Table 4' },
          items: [
            {
              id: 'item-1',
              nameSnapshot: 'Butter Chicken',
              quantity: 1,
              modifiers: [],
            },
          ],
          payments: [
            {
              id: 'pay-1',
              method: 'UPI',
              amount: '1200.00',
            },
          ],
        },
      ]);

      const history = await service.getHistory('branch-1', 'cust-1');

      expect(prisma.customer.findFirst).toHaveBeenCalledWith({
        where: { id: 'cust-1', branchId: 'branch-1' },
      });
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { customerId: 'cust-1', branchId: 'branch-1' },
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(history).toHaveLength(1);
      expect(history[0]).toHaveProperty('orderNumber', '20261124-0010');
    });

    it('throws NotFoundException if customer does not belong to branch', async () => {
      const { service, prisma } = buildMocks();
      prisma.customer.findFirst.mockResolvedValue(null);

      await expect(service.getHistory('branch-1', 'cust-other')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.order.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getConsentAudit', () => {
    it('retrieves all DPDP Act consent records ordered by date descending', async () => {
      const { service, prisma } = buildMocks();
      prisma.customer.findFirst.mockResolvedValue({ id: 'cust-1', branchId: 'branch-1' });
      prisma.customerConsent.findMany.mockResolvedValue([
        {
          id: 'consent-2',
          termsVersion: 'v1.0-2026',
          consentedAt: new Date('2026-11-24T12:00:00Z'),
          consentIp: '103.21.244.2',
          isAffirmative: true,
        },
        {
          id: 'consent-1',
          termsVersion: 'v1.0-2026',
          consentedAt: new Date('2026-10-15T10:00:00Z'),
          consentIp: '103.21.244.1',
          isAffirmative: true,
        },
      ]);

      const consents = await service.getConsentAudit('branch-1', 'cust-1');

      expect(prisma.customerConsent.findMany).toHaveBeenCalledWith({
        where: { customerId: 'cust-1' },
        orderBy: { consentedAt: 'desc' },
      });
      expect(consents).toHaveLength(2);
      expect(consents[0]).toHaveProperty('termsVersion', 'v1.0-2026');
    });

    it('retrieves DPDP consent records scoped to restaurantId when provided', async () => {
      const { service, prisma } = buildMocks();
      prisma.customer.findFirst.mockResolvedValue({ id: 'cust-1', branchId: 'branch-1' });
      prisma.customerConsent.findMany.mockResolvedValue([]);

      await service.getConsentAudit('branch-1', 'cust-1', 'rest-1');

      expect(prisma.customerConsent.findMany).toHaveBeenCalledWith({
        where: { customerId: 'cust-1', restaurantId: 'rest-1' },
        orderBy: { consentedAt: 'desc' },
      });
    });
  });
});
