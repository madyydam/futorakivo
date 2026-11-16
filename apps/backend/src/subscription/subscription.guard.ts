import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Unauthenticated or system-level endpoints are skipped
    if (!user || !user.restaurantId) {
      return true;
    }

    // Always allow GET (read-only audit, reports, views) and subscription/auth endpoints
    const method = request.method?.toUpperCase();
    const url = request.url || '';
    if (
      method === 'GET' ||
      url.includes('/v1/subscription') ||
      url.includes('/v1/auth') ||
      url.includes('/v1/super-admin')
    ) {
      return true;
    }

    // Check restaurant license status
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: user.restaurantId },
      select: {
        status: true,
        trialEndsAt: true,
        createdAt: true,
      },
    });

    if (!restaurant) {
      return true;
    }

    const now = new Date();
    const trialEnds =
      restaurant.trialEndsAt ||
      new Date(restaurant.createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);

    const isTrialExpired = restaurant.status === 'TRIAL' && now > trialEnds;
    const isSuspended = restaurant.status === 'SUSPENDED';
    const isExpired = restaurant.status === 'EXPIRED' || isTrialExpired;

    if (isSuspended) {
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          error: 'ACCOUNT_SUSPENDED',
          message:
            'This restaurant account has been suspended by the platform administrator. Please contact support.',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    if (isExpired) {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          error: 'SUBSCRIPTION_EXPIRED',
          message:
            'Your KIVO Cloud POS subscription trial has ended. Please choose a plan at /settings/billing to continue billing.',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    return true;
  }
}
