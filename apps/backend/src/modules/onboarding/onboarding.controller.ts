import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  UsePipes,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  updateOnboardingProgressSchema,
  type UpdateOnboardingProgressDto,
  type SessionUser,
} from '@futora/types';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuditAction } from '../../audit/audit-action';
import { OnboardingService } from './onboarding.service';

@ApiTags('onboarding')
@Controller('v1/onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Auth('settings.manage')
  @Get()
  async getProgress(@CurrentUser() user: SessionUser) {
    return this.onboardingService.getProgress(user.restaurantId);
  }

  @Auth('settings.manage')
  @AuditAction('update_progress', 'onboarding')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Put('progress')
  @UsePipes(new ZodValidationPipe(updateOnboardingProgressSchema))
  async updateProgress(
    @CurrentUser() user: SessionUser,
    @Body() body: UpdateOnboardingProgressDto,
  ) {
    return this.onboardingService.updateProgress(user.restaurantId, body);
  }

  @Auth('settings.manage')
  @AuditAction('complete', 'onboarding')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('complete')
  async completeOnboarding(@CurrentUser() user: SessionUser) {
    return this.onboardingService.completeOnboarding(user.restaurantId);
  }
}
