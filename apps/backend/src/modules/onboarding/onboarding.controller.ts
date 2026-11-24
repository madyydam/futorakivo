import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  UsePipes,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  updateOnboardingProgressSchema,
  type UpdateOnboardingProgressDto,
  type SessionUser,
} from '@futora/types';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
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
  @Put('progress')
  @UsePipes(new ZodValidationPipe(updateOnboardingProgressSchema))
  async updateProgress(
    @CurrentUser() user: SessionUser,
    @Body() body: UpdateOnboardingProgressDto,
  ) {
    return this.onboardingService.updateProgress(user.restaurantId, body);
  }

  @Auth('settings.manage')
  @Post('complete')
  async completeOnboarding(@CurrentUser() user: SessionUser) {
    return this.onboardingService.completeOnboarding(user.restaurantId);
  }
}
