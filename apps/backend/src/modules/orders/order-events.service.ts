import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface RecordOrderEventParams {
  restaurantId: string;
  outletId: string;
  entity: string; // 'Order' | 'Bill' | 'QrOrder' | 'PaymentRecord'
  entityId: string;
  eventType: string; // 'CREATED' | 'ITEM_ADDED' | 'KOT_SENT' | 'ITEM_CANCELLED' | 'ITEM_VOIDED' | 'DISCOUNT_APPLIED' | 'BILL_SPLIT' | 'PAYMENT_RECEIVED' | 'PAYMENT_VERIFIED' | 'SETTLED' | 'CANCELLED' | 'MERGED' | 'TABLE_TRANSFERRED'
  actorType: 'STAFF' | 'GUEST' | 'SYSTEM';
  actorId?: string;
  deviceId?: string;
  reason?: string;
  approvalId?: string;
  beforeState?: any;
  afterState?: any;
}

@Injectable()
export class OrderEventsService {
  private readonly logger = new Logger(OrderEventsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Append-only ledger recording of every mutation across orders, bills, and payments.
   */
  async record(params: RecordOrderEventParams) {
    try {
      return await this.prisma.orderEvent.create({
        data: {
          restaurantId: params.restaurantId,
          outletId: params.outletId,
          entity: params.entity,
          entityId: params.entityId,
          eventType: params.eventType,
          actorType: params.actorType,
          actorId: params.actorId ?? null,
          deviceId: params.deviceId ?? null,
          reason: params.reason ?? null,
          approvalId: params.approvalId ?? null,
          beforeState: params.beforeState ?? undefined,
          afterState: params.afterState ?? undefined,
        },
      });
    } catch (err) {
      this.logger.error(
        `Failed to record order event: ${(err as Error).message}`,
        (err as Error).stack,
      );
      return null;
    }
  }

  /**
   * Replay/audit history of events for an order or entity.
   */
  async listEvents(restaurantId: string, entityId: string) {
    return this.prisma.orderEvent.findMany({
      where: { restaurantId, entityId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
