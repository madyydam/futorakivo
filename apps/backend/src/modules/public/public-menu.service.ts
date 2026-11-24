import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import type { CartItemDto } from '@futora/types';
import { NotificationsService } from '../../notifications/notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../../realtime/realtime.gateway';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class PublicMenuService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    private readonly notifications: NotificationsService,
    private readonly realtime: RealtimeGateway,
  ) {}

  private async resolveTable(qrToken: string) {
    const table = await this.prisma.table.findUnique({
      where: { qrToken },
      include: {
        floor: {
          include: {
            branch: {
              include: {
                restaurant: true,
              },
            },
          },
        },
      },
    });
    if (!table) throw new NotFoundException('This QR code is not recognized');
    if (table.floor?.branch?.restaurant?.status === 'SUSPENDED') {
      throw new ForbiddenException(
        'This restaurant account is temporarily suspended.',
      );
    }
    return table;
  }

  async getMenuByQrToken(qrToken: string) {
    const table = await this.resolveTable(qrToken);
    const branch = table.floor.branch;
    const categories = await this.menuCategoriesForBranch(branch.id);
    return {
      branchName: branch.name,
      tableName: table.name ?? `Table ${table.number}`,
      categories,
    };
  }

  /** Customer-visible menu tree, shared by the table-QR page and the kiosk. */
  menuCategoriesForBranch(branchId: string) {
    return this.prisma.menuCategory.findMany({
      where: { branchId, isActive: true, showOnWebsite: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            price: true,
            taxRatePercent: true,
            isVeg: true,
            isVegan: true,
            spiceLevel: true,
            allergens: true,
            modifierGroups: {
              orderBy: { sortOrder: 'asc' },
              select: {
                modifierGroup: {
                  select: {
                    id: true,
                    name: true,
                    minSelect: true,
                    maxSelect: true,
                    isRequired: true,
                    modifiers: {
                      orderBy: { sortOrder: 'asc' },
                      select: {
                        id: true,
                        name: true,
                        priceAdjustment: true,
                        isDefault: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async createOrder(
    qrToken: string,
    items: CartItemDto[],
    guestName: string,
    guestPhone: string,
    termsAccepted = true,
    ip = '127.0.0.1',
    userAgent = 'Unknown',
  ) {
    const table = await this.resolveTable(qrToken);
    const branchId = table.floor.branchId;
    const restaurantId = table.floor.branch.restaurantId;

    // Automatic CRM capture: create or link customer profile by phone number (master key)
    const cleanPhone = guestPhone.trim();

    // 1. Anti-Abuse Shield: Check if phone number is blocked by outlet management
    const phoneHash = createHash('sha256').update(cleanPhone).digest('hex');
    const blockedGuest = await this.prisma.guestBlock.findFirst({
      where: {
        outletId: branchId,
        phoneHash,
        OR: [{ blockedUntil: null }, { blockedUntil: { gt: new Date() } }],
      },
    });
    if (blockedGuest) {
      throw new ForbiddenException(
        'This mobile number has been restricted from placing online orders. Please speak with restaurant staff.',
      );
    }

    // 2. Operational Controls: Check QR ordering settings (Emergency Pause & Item Limits)
    const qrSettings = await this.prisma.qrSettings.findUnique({
      where: { outletId: branchId },
    });
    if (qrSettings?.orderingPaused) {
      throw new BadRequestException('QR ordering is temporarily paused by the restaurant.');
    }
    if (qrSettings?.maxItemsPerOrder) {
      const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
      if (totalCount > qrSettings.maxItemsPerOrder) {
        throw new BadRequestException(
          `Order exceeds the maximum limit of ${qrSettings.maxItemsPerOrder} items per order.`,
        );
      }
    }
    if (qrSettings?.maxQtyPerLine) {
      const lineOver = items.find((item) => item.quantity > qrSettings.maxQtyPerLine);
      if (lineOver) {
        throw new BadRequestException(
          `Maximum quantity per item line is ${qrSettings.maxQtyPerLine}.`,
        );
      }
    }

    let customer = await this.prisma.customer.findFirst({
      where: { branchId, phone: cleanPhone },
    });

    if (customer) {
      // Returning customer: preserve ID, increment visit counter, update last seen
      customer = await this.prisma.customer.update({
        where: { id: customer.id },
        data: {
          name: guestName,
          visitCount: { increment: 1 },
          lastTableNumber: table.number,
          lastVisitedAt: new Date(),
        },
      });
    } else {
      // First-time customer
      customer = await this.prisma.customer.create({
        data: {
          branchId,
          name: guestName,
          phone: cleanPhone,
          visitCount: 1,
          lastTableNumber: table.number,
          lastVisitedAt: new Date(),
        },
      });
    }

    const customerId = customer.id;

    // DPDP Act 2023 Consent Audit Recording:
    if (termsAccepted) {
      await this.prisma.customerConsent.create({
        data: {
          restaurantId,
          customerId,
          termsVersion: 'v1.0-2026',
          consentedAt: new Date(),
          consentIp: ip || '127.0.0.1',
          userAgent: userAgent || 'Unknown',
          isAffirmative: true,
          scope: 'BILLING,SERVICE,LOYALTY',
        },
      });
    }

    // A guest who already ordered once this visit and scans again to add
    // more (e.g. drinks now, food later) should land on the same tab, not
    // open a second order for the table — mirrors how staff add a round
    // from the POS for an occupied table.
    const existingOrder = await this.prisma.order.findFirst({
      where: {
        branchId,
        tableId: table.id,
        status: { in: ['OPEN', 'BILLED'] },
      },
    });
    if (existingOrder) {
      if (existingOrder.status === 'BILLED') {
        throw new BadRequestException(
          'The bill for this table is already printed. Please ask your server to reopen the bill or settle your payment before ordering more.',
        );
      }
      return this.ordersService.addItems(branchId, existingOrder.id, items, {
        enforceModifierLimits: true,
        websiteOnly: true,
      });
    }

    // A guest scanning a QR code has no staff account, but Order.createdById
    // is a required FK — attribute the order to whoever is on the floor for
    // this table (assigned waiter), falling back to any staff member linked
    // to the branch (every branch has at least its owner) so this never
    // fails for lack of a "system user" that doesn't otherwise exist.
    const createdById =
      table.assignedWaiterId ??
      (
        await this.prisma.userBranch.findFirst({
          where: { branchId },
          orderBy: { userId: 'asc' },
        })
      )?.userId;
    if (!createdById) {
      throw new NotFoundException(
        'This branch has no staff to receive the order',
      );
    }

    return this.ordersService.createOrder(
      branchId,
      createdById,
      {
        type: 'QR_ORDER',
        tableId: table.id,
        customerId,
        guestName,
        items,
      },
      { channel: 'ONLINE', requireAcceptance: true },
    );
  }

  /** Live status of the table's current tab, for the guest's QR page with strict 3-hour TTL privacy shield */
  async getStatus(qrToken: string) {
    const table = await this.resolveTable(qrToken);
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const order = await this.prisma.order.findFirst({
      where: {
        tableId: table.id,
        status: { in: ['OPEN', 'BILLED'] },
        createdAt: { gte: threeHoursAgo }, // Strict 3-Hour TTL privacy shield
      },
      orderBy: { createdAt: 'desc' },
      select: {
        orderNumber: true,
        status: true,
        acceptance: true,
        totalAmount: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            nameSnapshot: true,
            quantity: true,
            status: true,
          },
        },
      },
    });
    const requests = await this.prisma.tableRequest.findMany({
      where: { tableId: table.id, resolvedAt: null },
      select: { type: true },
    });
    return { order, openRequests: requests.map((r) => r.type), expired: !order };
  }

  /** "Call waiter" / "Bring the bill". One open request per type per table. */
  async createRequest(qrToken: string, type: 'WAITER' | 'BILL') {
    const table = await this.resolveTable(qrToken);
    const branchId = table.floor.branchId;
    const existing = await this.prisma.tableRequest.findFirst({
      where: { tableId: table.id, type, resolvedAt: null },
    });
    if (existing) return { ok: true, alreadyRequested: true };

    const request = await this.prisma.tableRequest.create({
      data: { branchId, tableId: table.id, type },
    });
    this.realtime.emitToBranch(branchId, 'table.request', { id: request.id });
    const tableName = table.name ?? `Table ${table.number}`;
    try {
      await this.notifications.notifyByPermission(branchId, 'tables.manage', {
        type: type === 'BILL' ? 'table.bill' : 'table.waiter',
        title:
          type === 'BILL'
            ? `${tableName} wants the bill`
            : `${tableName} needs a waiter`,
        body: 'Requested from the table QR code',
        entity: 'Table',
        entityId: table.id,
      });
    } catch {
      // Best-effort: the request row and live event already exist.
    }
    return { ok: true, alreadyRequested: false };
  }
}
