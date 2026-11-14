import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuperAdminService {
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
          monthlyGmv: `₹${gmv.toLocaleString('en-IN')}`,
          monthlyOrders: ordersCount,
          plan: (r.plan as 'Starter' | 'Growth' | 'Enterprise') || 'Starter',
          status: (r.status as 'ACTIVE' | 'TRIAL' | 'SUSPENDED') || 'TRIAL',
          trialEndsAt: r.trialEndsAt,
          maxBranches: r.maxBranches,
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

    return {
      totalRestaurants,
      activeRestaurants,
      trialRestaurants,
      totalBranches,
      totalGmv: totalGmvVal ? Number(totalGmvVal) : 0,
      totalOrders: totalOrdersAgg._count?._all ?? 0,
    };
  }
}
