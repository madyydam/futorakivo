import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { SessionUser } from '@futora/types';
import { Auth } from '../common/decorators/auth.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SubscriptionService } from './subscription.service';

@ApiTags('subscription')
@Controller('v1/subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Auth()
  @Get()
  async getStatus(@CurrentUser() user: SessionUser) {
    return this.subscriptionService.getSubscriptionStatus(user.restaurantId);
  }

  @Auth()
  @Post('create-order')
  async createOrder(
    @CurrentUser() user: SessionUser,
    @Body('plan') plan: string,
    @Body('billingCycle') billingCycle: 'MONTHLY' | 'ANNUAL',
  ) {
    return this.subscriptionService.createCheckoutOrder(
      user.restaurantId,
      plan || 'Starter',
      billingCycle || 'MONTHLY',
    );
  }

  @Auth()
  @Post('verify-payment')
  async verifyPayment(
    @CurrentUser() user: SessionUser,
    @Body()
    body: {
      orderId: string;
      paymentId?: string;
      plan: string;
      billingCycle: 'MONTHLY' | 'ANNUAL';
      baseAmount: number;
      taxAmount: number;
      totalAmount: number;
    },
  ) {
    return this.subscriptionService.verifyPayment(user.restaurantId, body);
  }

  @Auth()
  @Get('invoices')
  async getInvoices(@CurrentUser() user: SessionUser) {
    return this.subscriptionService.getInvoices(user.restaurantId);
  }

  @Auth()
  @Post('cancel')
  async cancelSubscription(@CurrentUser() user: SessionUser) {
    return this.subscriptionService.cancelSubscription(user.restaurantId);
  }
}
