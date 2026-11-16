import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { SessionUser } from '@futora/types';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AggregatorOrderPayload } from './aggregator.service';
import { AggregatorService } from './aggregator.service';

@ApiTags('aggregators')
@Controller('v1/aggregators')
export class AggregatorController {
  constructor(private readonly aggregatorService: AggregatorService) {}

  @Auth()
  @Get('status')
  async getStatus(@CurrentUser() user: SessionUser) {
    return this.aggregatorService.getAggregatorStatus(user.restaurantId);
  }

  // Public webhook receiver invoked by Zomato, Swiggy, ONDC, Magicpin
  @Post('webhook/:platform')
  async handleWebhook(
    @Param('platform') platform: 'zomato' | 'swiggy' | 'ondc' | 'magicpin',
    @Body() payload: AggregatorOrderPayload,
    @Query('branchId') branchId?: string,
  ) {
    return this.aggregatorService.handleInboundWebhook(platform, payload, branchId);
  }

  @Auth()
  @Post('orders/:id/action')
  async handleAction(
    @Param('id') orderId: string,
    @Body('action') action: 'ACCEPT' | 'REJECT' | 'FOOD_READY' | 'DISPATCHED',
    @Body('reason') reason?: string,
  ) {
    return this.aggregatorService.handleOrderAction(orderId, action, reason);
  }

  @Auth()
  @Post('items/toggle-stock')
  async toggleStock(
    @CurrentUser() user: SessionUser,
    @Body('itemId') itemId: string,
    @Body('isAvailable') isAvailable: boolean,
  ) {
    return this.aggregatorService.toggleItemStock(user.restaurantId, itemId, Boolean(isAvailable));
  }

  @Auth()
  @Post('simulate-order')
  async simulateOrder(
    @CurrentUser() user: SessionUser,
    @Body('platform') platform: 'zomato' | 'swiggy' | 'ondc',
  ) {
    return this.aggregatorService.simulateIncomingOrder(user.restaurantId, platform || 'zomato');
  }
}
