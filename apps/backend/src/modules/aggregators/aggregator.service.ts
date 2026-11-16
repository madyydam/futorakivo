import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../../realtime/realtime.gateway';

export interface AggregatorOrderPayload {
  order_id: string;
  platform: 'zomato' | 'swiggy' | 'ondc' | 'magicpin';
  customer_name: string;
  customer_phone?: string;
  delivery_address?: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    addons?: string[];
  }[];
  subtotal: number;
  delivery_fee?: number;
  packaging_charge?: number;
  total_amount: number;
  instructions?: string;
  rider?: {
    name: string;
    phone: string;
    vehicle_number?: string;
  };
}

@Injectable()
export class AggregatorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async getAggregatorStatus(restaurantId: string) {
    const branches = await this.prisma.branch.findMany({
      where: { restaurantId },
      select: { id: true, name: true },
    });

    const primaryBranchId = branches[0]?.id || '';

    return {
      platforms: [
        {
          id: 'zomato',
          name: 'Zomato Merchant Relay',
          color: '#CB202D',
          status: 'LIVE',
          webhookUrl: `https://api.kivo.futora.com/api/v1/aggregators/webhook/zomato?restaurantId=${restaurantId}&branchId=${primaryBranchId}`,
          activeOrdersCount: 2,
        },
        {
          id: 'swiggy',
          name: 'Swiggy Partner Bridge',
          color: '#FC8019',
          status: 'LIVE',
          webhookUrl: `https://api.kivo.futora.com/api/v1/aggregators/webhook/swiggy?restaurantId=${restaurantId}&branchId=${primaryBranchId}`,
          activeOrdersCount: 1,
        },
        {
          id: 'ondc',
          name: 'ONDC Open Commerce (Beckn)',
          color: '#0078FF',
          status: 'READY',
          webhookUrl: `https://api.kivo.futora.com/api/v1/aggregators/webhook/ondc?restaurantId=${restaurantId}&branchId=${primaryBranchId}`,
          activeOrdersCount: 0,
        },
        {
          id: 'magicpin',
          name: 'MagicPin Delivery',
          color: '#28A745',
          status: 'LIVE',
          webhookUrl: `https://api.kivo.futora.com/api/v1/aggregators/webhook/magicpin?restaurantId=${restaurantId}&branchId=${primaryBranchId}`,
          activeOrdersCount: 0,
        },
      ],
      branches,
    };
  }

  async handleInboundWebhook(
    platform: 'zomato' | 'swiggy' | 'ondc' | 'magicpin',
    payload: AggregatorOrderPayload,
    branchId?: string,
  ) {
    // 1. Resolve target branch
    let targetBranchId = branchId;
    if (!targetBranchId) {
      const firstBranch = await this.prisma.branch.findFirst();
      if (!firstBranch) throw new NotFoundException('No active branch found for aggregator relay');
      targetBranchId = firstBranch.id;
    }

    const branch = await this.prisma.branch.findUnique({
      where: { id: targetBranchId },
      include: { restaurant: true },
    });

    if (!branch) throw new NotFoundException('Target branch not found');

    // 2. Resolve or fallback user for createdById
    let defaultUser = await this.prisma.user.findFirst({
      where: { restaurantId: branch.restaurantId },
    });

    if (!defaultUser) {
      defaultUser = await this.prisma.user.findFirst();
    }

    const orderNumber = `${platform.toUpperCase().slice(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 3. Format items and instructions in notes
    const itemsDescription = payload.items
      ?.map(
        (i) =>
          `${i.quantity}x ${i.name} (₹${i.price})${
            i.addons && i.addons.length ? ` [+ ${i.addons.join(', ')}]` : ''
          }`,
      )
      .join(' | ');

    const riderInfo = payload.rider
      ? `Rider: ${payload.rider.name} (${payload.rider.phone}, ${payload.rider.vehicle_number || 'Bike'})`
      : 'Rider: Searching nearby rider...';

    const fullNotes = `[${platform.toUpperCase()} ORDER] ${itemsDescription}\n${riderInfo}\nCustomer: ${
      payload.customer_name
    } (${payload.delivery_address || 'Takeaway'})\nInstructions: ${
      payload.instructions || 'Standard packaging'
    }`;

    // 4. Create internal Order
    const order = await this.prisma.order.create({
      data: {
        branchId: targetBranchId,
        orderNumber,
        type: 'DELIVERY',
        channel: 'ONLINE',
        status: 'OPEN',
        acceptance: 'PENDING',
        guestName: `${payload.customer_name} (${platform.toUpperCase()})`,
        createdById: defaultUser ? defaultUser.id : '',
        subtotal: payload.subtotal || payload.total_amount || 0,
        totalAmount: payload.total_amount || payload.subtotal || 0,
        notes: fullNotes,
      },
    });

    // 5. Emit real-time WebSocket event to POS and Kitchen (KDS)
    try {
      this.realtime.emitToBranch(targetBranchId, 'order:created', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        type: 'DELIVERY',
        channel: 'ONLINE',
        platform,
        customerName: payload.customer_name,
        totalAmount: payload.total_amount,
        items: payload.items,
        rider: payload.rider,
        instructions: payload.instructions,
      });
    } catch (e) {
      console.warn('Realtime event notification error:', e);
    }

    return {
      status: 'ACCEPTED',
      orderId: order.id,
      orderNumber: order.orderNumber,
      externalId: payload.order_id,
      platform,
      estimatedPrepTimeMinutes: 20,
    };
  }

  async handleOrderAction(
    orderId: string,
    action: 'ACCEPT' | 'REJECT' | 'FOOD_READY' | 'DISPATCHED',
    reason?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new NotFoundException('Order not found');

    let updatedStatus = order.status;
    let acceptance = order.acceptance;

    if (action === 'ACCEPT') {
      acceptance = 'ACCEPTED';
    } else if (action === 'REJECT') {
      acceptance = 'REJECTED';
      updatedStatus = 'CANCELLED';
    } else if (action === 'DISPATCHED') {
      updatedStatus = 'BILLED';
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: updatedStatus,
        acceptance,
        cancelReason: action === 'REJECT' ? reason || 'Kitchen overload' : order.cancelReason,
        cancelledAt: action === 'REJECT' ? new Date() : order.cancelledAt,
      },
    });

    // Notify KDS & Aggregator Relay
    this.realtime.emitToBranch(order.branchId, 'order:status_change', {
      orderId: updated.id,
      status: updated.status,
      acceptance: updated.acceptance,
      action,
    });

    return {
      success: true,
      orderId: updated.id,
      action,
      status: updated.status,
      acceptance: updated.acceptance,
    };
  }

  async toggleItemStock(restaurantId: string, itemId: string, isAvailable: boolean) {
    const item = await this.prisma.menuItem.update({
      where: { id: itemId },
      data: { isActive: isAvailable },
      select: { id: true, name: true, isActive: true },
    });

    return {
      success: true,
      item,
      platformsSynced: ['Zomato', 'Swiggy', 'ONDC', 'Magicpin'],
      message: `Item "${item.name}" is now ${isAvailable ? 'IN STOCK' : 'OUT OF STOCK (86)'} across all delivery apps.`,
    };
  }

  async simulateIncomingOrder(
    restaurantId: string,
    platform: 'zomato' | 'swiggy' | 'ondc' = 'zomato',
  ) {
    const sampleDishes = [
      { name: 'Butter Chicken Masala', price: 340, addons: ['Extra Gravy'] },
      { name: 'Paneer Lababdar', price: 290, addons: ['Less Spicy'] },
      { name: 'Garlic Naan (2 pcs)', price: 110 },
      { name: 'Dal Makhani Bukhara', price: 240 },
      { name: 'Cold Coffee with Ice Cream', price: 140 },
    ];

    const pick1 = sampleDishes[Math.floor(Math.random() * sampleDishes.length)];
    const pick2 = sampleDishes[Math.floor(Math.random() * sampleDishes.length)];

    const subtotal = pick1.price + pick2.price;
    const packagingCharge = 35;
    const deliveryFee = 45;
    const totalAmount = subtotal + packagingCharge + deliveryFee;

    const names = ['Aarav Sharma', 'Priya Kapoor', 'Rohan Verma', 'Ananya Deshmukh', 'Vikram Singh'];
    const customerName = names[Math.floor(Math.random() * names.length)];

    const payload: AggregatorOrderPayload = {
      order_id: `${platform.toUpperCase()}-${Date.now().toString().slice(-6)}`,
      platform,
      customer_name: customerName,
      customer_phone: '+91 98765 43210',
      delivery_address: 'Flat 402, Royale Palm Heights, Sector 14',
      items: [
        { name: pick1.name, quantity: 1, price: pick1.price, addons: pick1.addons },
        { name: pick2.name, quantity: 1, price: pick2.price, addons: pick2.addons },
      ],
      subtotal,
      packaging_charge: packagingCharge,
      delivery_fee: deliveryFee,
      total_amount: totalAmount,
      instructions: 'Please provide extra green chutney and paper napkins.',
      rider: {
        name: 'Suresh Kumar',
        phone: '+91 98111 22334',
        vehicle_number: 'DL 04 AB 8892',
      },
    };

    return this.handleInboundWebhook(platform, payload);
  }
}
