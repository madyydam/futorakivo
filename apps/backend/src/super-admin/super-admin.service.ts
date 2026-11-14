import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PlatformBroadcast {
  id: string;
  title: string;
  message: string;
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  createdAt: string;
  active: boolean;
}

@Injectable()
export class SuperAdminService {
  private broadcasts: PlatformBroadcast[] = [
    {
      id: 'bc-1',
      title: 'Scheduled Cloud Maintenance',
      message: 'Database automated indexing scheduled for Sunday 2:00 AM - 2:30 AM IST. Offline POS mode will maintain uninterrupted local billing.',
      level: 'INFO',
      createdAt: 'Today, 10:00 AM',
      active: true,
    },
    {
      id: 'bc-2',
      title: 'New Feature: Direct Wi-Fi Thermal KOT Printing',
      message: 'Direct LAN IP printing (80mm/58mm ESC/POS) is now available for all branches on Growth & Enterprise plans.',
      level: 'INFO',
      createdAt: 'Yesterday, 04:30 PM',
      active: true,
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  async getTenants() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const restaurants = await this.prisma.restaurant.findMany({
      include: {
        _count: {
          select: {
            branches: true,
            users: true,
          },
        },
        branches: {
          select: { id: true, name: true, phone: true, address: true, gstNumber: true },
        },
        users: {
          where: { role: { name: 'OWNER' } },
          select: { name: true, email: true, phone: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const results = await Promise.all(
      restaurants.map(async (r) => {
        const orderStats = await this.prisma.order.aggregate({
          where: {
            branch: { restaurantId: r.id },
            createdAt: { gte: thirtyDaysAgo },
            status: { in: ['PAID', 'BILLED'] },
          },
          _sum: { totalAmount: true },
          _count: { _all: true },
        });

        const owner = r.users[0];
        const sumVal = orderStats._sum?.totalAmount;
        const gmv = sumVal ? Number(sumVal) : 0;
        const ordersCount = orderStats._count?._all ?? 0;

        return {
          id: r.id,
          restaurantName: r.name,
          ownerName: owner?.name || 'Owner',
          email: owner?.email || '',
          phone: owner?.phone || r.ownerPhone || '',
          city: r.city || 'India',
          branchesCount: r._count.branches,
          branches: r.branches,
          monthlyGmv: `₹${gmv.toLocaleString('en-IN')}`,
          monthlyOrders: ordersCount,
          plan: (r.plan as 'Starter' | 'Growth' | 'Enterprise') || 'Starter',
          status: (r.status as 'ACTIVE' | 'TRIAL' | 'SUSPENDED') || 'TRIAL',
          trialEndsAt: r.trialEndsAt,
          maxBranches: r.maxBranches,
          currency: r.currency || 'INR',
          upiVpa: r.upiVpa || 'Not configured',
          joinedDate: r.createdAt.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
        };
      }),
    );

    return results;
  }

  async updateTenantStatus(id: string, status: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    return this.prisma.restaurant.update({
      where: { id },
      data: { status },
    });
  }

  async updateTenantPlan(id: string, plan: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const branchLimits: Record<string, number> = {
      Starter: 1,
      Growth: 3,
      Enterprise: 100,
    };

    return this.prisma.restaurant.update({
      where: { id },
      data: {
        plan,
        maxBranches: branchLimits[plan] || 1,
        status: 'ACTIVE',
      },
    });
  }

  async extendTrial(id: string, days: number = 14) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const currentExpiry = restaurant.trialEndsAt ? new Date(restaurant.trialEndsAt) : new Date();
    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + days);

    return this.prisma.restaurant.update({
      where: { id },
      data: {
        trialEndsAt: newExpiry,
        status: 'TRIAL',
      },
    });
  }

  async getPlatformAnalytics() {
    const [totalRestaurants, totalBranches, totalOrdersAgg] = await Promise.all([
      this.prisma.restaurant.count(),
      this.prisma.branch.count(),
      this.prisma.order.aggregate({
        where: { status: { in: ['PAID', 'BILLED'] } },
        _sum: { totalAmount: true },
        _count: { _all: true },
      }),
    ]);

    const activeRestaurants = await this.prisma.restaurant.count({
      where: { status: 'ACTIVE' },
    });

    const trialRestaurants = await this.prisma.restaurant.count({
      where: { status: 'TRIAL' },
    });

    const totalGmvVal = totalOrdersAgg._sum?.totalAmount;
    const mrr = (activeRestaurants * 1499) + (trialRestaurants * 0);

    return {
      totalRestaurants,
      activeRestaurants,
      trialRestaurants,
      totalBranches,
      mrr: `₹${mrr.toLocaleString('en-IN')}`,
      totalGmv: totalGmvVal ? Number(totalGmvVal) : 0,
      totalOrders: totalOrdersAgg._count?._all ?? 0,
    };
  }

  getPlans() {
    return [
      {
        id: 'plan-starter',
        name: 'Starter',
        priceMonthly: 599,
        priceYearly: 5999,
        currency: 'INR',
        maxBranches: 1,
        features: [
          'Dine-in, Takeaway & Delivery POS',
          'Thermal Bill & KOT Printing (USB/LAN)',
          'UPI QR Dynamic NPCI Payments',
          'Daily Nightly Cash Closing & Report',
          'Offline POS with Auto Cloud Sync',
        ],
        popular: false,
      },
      {
        id: 'plan-growth',
        name: 'Growth',
        priceMonthly: 1499,
        priceYearly: 14999,
        currency: 'INR',
        maxBranches: 3,
        features: [
          'Everything in Starter',
          'Live Kitchen Display System (KDS)',
          'Contactless Table QR Ordering',
          'Recipe Management & Ingredient Costing',
          'Staff Attendance & Clock-In Payroll',
          'Zomato & Swiggy Order Relay',
        ],
        popular: true,
      },
      {
        id: 'plan-enterprise',
        name: 'Enterprise',
        priceMonthly: 3999,
        priceYearly: 39999,
        currency: 'INR',
        maxBranches: 100,
        features: [
          'Everything in Growth',
          'Unlimited Outlets & Central Kitchen Hub',
          'Inter-Branch Stock Indents & Transfers',
          'Consolidated Brand P&L Analytics',
          'WhatsApp Automated Marketing Campaigns',
          'Dedicated Account Manager & 24/7 SLA',
        ],
        popular: false,
      },
    ];
  }

  getBroadcasts() {
    return this.broadcasts;
  }

  createBroadcast(title: string, message: string, level: 'INFO' | 'WARNING' | 'CRITICAL') {
    const item: PlatformBroadcast = {
      id: `bc-${Date.now()}`,
      title,
      message,
      level,
      createdAt: 'Just now',
      active: true,
    };
    this.broadcasts.unshift(item);
    return item;
  }
}
