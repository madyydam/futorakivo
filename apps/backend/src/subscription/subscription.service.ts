import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PlanDetails {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  maxBranches: number;
  description: string;
  features: string[];
  popular?: boolean;
}

export const SAAS_PLANS: PlanDetails[] = [
  {
    id: 'Starter',
    name: 'Starter Plan',
    monthlyPrice: 599,
    annualPrice: 5999,
    maxBranches: 1,
    description: 'Perfect for cafes, quick-service counters, and standalone bistros.',
    features: [
      '1 Single Outlet / Branch',
      'Unlimited Cloud Billing & KOTs',
      'Dynamic UPI QR Payment Settlement',
      'Table Management & Waiter App',
      'Kitchen Display System (KDS)',
      'Basic Inventory & Stock Alerts',
      'Online Cloud Backups & Reporting',
    ],
  },
  {
    id: 'Growth',
    name: 'Growth Plan',
    monthlyPrice: 1499,
    annualPrice: 14999,
    maxBranches: 3,
    popular: true,
    description: 'Designed for high-volume dine-in restaurants and emerging multi-outlet brands.',
    features: [
      'Up to 3 Outlets / Branches Included',
      'Everything in Starter',
      'Direct Thermal LAN IP & Bluetooth Printing',
      'Central Recipe & Ingredient Level Costing',
      'Staff Role-Based Permissions & Attendance',
      'Zomato & Swiggy Order Relay Integration',
      'Loyalty Program & Customer CRM',
      'Priority Email & Chat Support',
    ],
  },
  {
    id: 'Enterprise',
    name: 'Enterprise Plan',
    monthlyPrice: 3999,
    annualPrice: 39999,
    maxBranches: 999,
    description: 'For restaurant chains, franchises, and large cloud kitchens requiring custom scale.',
    features: [
      'Unlimited Outlets & Central Kitchen Hub',
      'Everything in Growth',
      'Inter-Branch Stock Transfer & Indent Engine',
      'Consolidated Brand P&L Analytics',
      'Custom Webhooks & REST API Access',
      'Multi-Terminal Concurrency & Zero-Lag Sync',
      'Dedicated Account Manager & 24/7 Phone SLA',
    ],
  },
];

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async getSubscriptionStatus(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        name: true,
        status: true,
        plan: true,
        maxBranches: true,
        trialEndsAt: true,
        createdAt: true,
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant tenant not found');
    }

    const branchesUsed = await this.prisma.branch.count({
      where: { restaurantId },
    });

    const activeSubscription = await this.prisma.subscription.findFirst({
      where: {
        restaurantId,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        invoices: {
          take: 3,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const now = new Date();
    const trialEnds = restaurant.trialEndsAt || new Date(restaurant.createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);
    const msLeft = trialEnds.getTime() - now.getTime();
    const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
    const isTrialExpired = restaurant.status === 'TRIAL' && msLeft <= 0;
    const isExpired = restaurant.status === 'EXPIRED' || isTrialExpired;

    return {
      restaurant: {
        ...restaurant,
        branchesUsed,
        effectiveStatus: isExpired ? 'EXPIRED' : restaurant.status,
      },
      trial: {
        isTrial: restaurant.status === 'TRIAL',
        daysLeft,
        trialEndsAt: trialEnds,
        isExpired: isTrialExpired,
      },
      activeSubscription: activeSubscription
        ? {
            id: activeSubscription.id,
            plan: activeSubscription.plan,
            billingCycle: activeSubscription.billingCycle,
            amount: Number(activeSubscription.amount),
            currency: activeSubscription.currency,
            status: activeSubscription.status,
            currentPeriodStart: activeSubscription.currentPeriodStart,
            currentPeriodEnd: activeSubscription.currentPeriodEnd,
            cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd,
          }
        : null,
      limits: {
        maxBranches: restaurant.maxBranches,
        branchesUsed,
        canAddBranch: branchesUsed < restaurant.maxBranches,
      },
      plans: SAAS_PLANS,
    };
  }

  async createCheckoutOrder(
    restaurantId: string,
    planId: string,
    billingCycle: 'MONTHLY' | 'ANNUAL' = 'MONTHLY',
  ) {
    const plan = SAAS_PLANS.find((p) => p.id === planId);
    if (!plan) {
      throw new BadRequestException(`Invalid plan selected: ${planId}`);
    }

    const baseAmount = billingCycle === 'ANNUAL' ? plan.annualPrice : plan.monthlyPrice;
    const taxAmount = Math.round(baseAmount * 0.18); // 18% GST
    const totalAmount = baseAmount + taxAmount;
    const orderId = `ord_kivo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return {
      orderId,
      plan: plan.id,
      planName: plan.name,
      billingCycle,
      baseAmount,
      taxAmount,
      totalAmount,
      currency: 'INR',
      keyId: 'rzp_test_kivo_cloud',
      notes: {
        restaurantId,
        gstRate: '18%',
      },
    };
  }

  async verifyPayment(
    restaurantId: string,
    payload: {
      orderId: string;
      paymentId?: string;
      plan: string;
      billingCycle: 'MONTHLY' | 'ANNUAL';
      baseAmount: number;
      taxAmount: number;
      totalAmount: number;
    },
  ) {
    const plan = SAAS_PLANS.find((p) => p.id === payload.plan);
    if (!plan) {
      throw new BadRequestException(`Invalid plan: ${payload.plan}`);
    }

    const now = new Date();
    const periodEnd = new Date(now);
    if (payload.billingCycle === 'ANNUAL') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setDate(periodEnd.getDate() + 30);
    }

    // 1. Deactivate any prior active subscriptions
    await this.prisma.subscription.updateMany({
      where: { restaurantId, status: 'ACTIVE' },
      data: { status: 'CANCELLED' },
    });

    // 2. Create the new active Subscription
    const subscription = await this.prisma.subscription.create({
      data: {
        restaurantId,
        plan: plan.id,
        billingCycle: payload.billingCycle,
        amount: payload.totalAmount,
        currency: 'INR',
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        razorpaySubscriptionId: payload.orderId,
      },
    });

    // 3. Generate official Tax Invoice
    const invoiceNumber = `INV-KIVO-${now.getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const invoice = await this.prisma.subscriptionInvoice.create({
      data: {
        subscriptionId: subscription.id,
        restaurantId,
        invoiceNumber,
        plan: plan.name,
        billingCycle: payload.billingCycle,
        amount: payload.baseAmount,
        taxAmount: payload.taxAmount,
        totalAmount: payload.totalAmount,
        currency: 'INR',
        status: 'PAID',
        paidAt: now,
        razorpayOrderId: payload.orderId,
        razorpayPaymentId: payload.paymentId || `pay_sim_${Date.now()}`,
      },
    });

    // 4. Update the Restaurant Tenant status, plan and max branches
    await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        status: 'ACTIVE',
        plan: plan.id,
        maxBranches: plan.maxBranches,
        trialEndsAt: null, // Clear trial since paid active
      },
    });

    return {
      success: true,
      message: `Successfully upgraded to ${plan.name} (${payload.billingCycle.toLowerCase()})`,
      subscriptionId: subscription.id,
      invoiceNumber: invoice.invoiceNumber,
      plan: plan.id,
      currentPeriodEnd: periodEnd,
    };
  }

  async getInvoices(restaurantId: string) {
    const invoices = await this.prisma.subscriptionInvoice.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
    });

    return invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      plan: inv.plan,
      billingCycle: inv.billingCycle,
      baseAmount: Number(inv.amount),
      taxAmount: Number(inv.taxAmount),
      totalAmount: Number(inv.totalAmount),
      currency: inv.currency,
      status: inv.status,
      paidAt: inv.paidAt,
      pdfUrl: inv.pdfUrl,
      createdAt: inv.createdAt,
    }));
  }

  async cancelSubscription(restaurantId: string) {
    const active = await this.prisma.subscription.findFirst({
      where: { restaurantId, status: 'ACTIVE' },
    });

    if (!active) {
      throw new BadRequestException('No active paid subscription found to cancel');
    }

    await this.prisma.subscription.update({
      where: { id: active.id },
      data: { cancelAtPeriodEnd: true },
    });

    return {
      success: true,
      message: 'Subscription will remain active until the end of current period and will not renew.',
    };
  }
}
