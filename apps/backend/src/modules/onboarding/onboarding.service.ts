import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { UpdateOnboardingProgressDto } from '@futora/types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves or initializes the restaurant's onboarding state.
   */
  async getProgress(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true, name: true, status: true },
    });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    let progress = await this.prisma.onboardingProgress.findUnique({
      where: { restaurantId },
    });

    if (!progress) {
      progress = await this.prisma.onboardingProgress.create({
        data: {
          restaurantId,
          currentStep: 1,
          completedSteps: [],
          draftJson: {},
        },
      });
    }

    return {
      currentStep: progress.currentStep,
      completedSteps: progress.completedSteps,
      draftJson: progress.draftJson,
      restaurant,
    };
  }

  /**
   * Atomically saves step draft and updates completed step progression.
   */
  async updateProgress(
    restaurantId: string,
    dto: UpdateOnboardingProgressDto,
  ) {
    const existing = await this.getProgress(restaurantId);

    const completedSet = new Set(existing.completedSteps);
    if (dto.completedStep) {
      completedSet.add(dto.completedStep);
    }

    const mergedDraft = {
      ...((existing.draftJson as Record<string, any>) || {}),
      ...(dto.draftJson || {}),
    };

    const updated = await this.prisma.onboardingProgress.update({
      where: { restaurantId },
      data: {
        currentStep: dto.currentStep,
        completedSteps: Array.from(completedSet).sort((a, b) => a - b),
        draftJson: mergedDraft as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      currentStep: updated.currentStep,
      completedSteps: updated.completedSteps,
      draftJson: updated.draftJson,
      restaurant: existing.restaurant,
    };
  }

  /**
   * Finalizes the 11-step onboarding wizard and transitions restaurant to active state.
   */
  async completeOnboarding(restaurantId: string) {
    const allSteps = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

    await this.prisma.$transaction(async (tx) => {
      await tx.onboardingProgress.upsert({
        where: { restaurantId },
        create: {
          restaurantId,
          currentStep: 11,
          completedSteps: allSteps,
          draftJson: {},
        },
        update: {
          currentStep: 11,
          completedSteps: allSteps,
        },
      });

      const restaurant = await tx.restaurant.findUnique({
        where: { id: restaurantId },
        select: { status: true },
      });

      if (restaurant && restaurant.status === 'TRIAL') {
        // Keep TRIAL status with active trial dates
      } else if (restaurant && (restaurant.status as string) === 'SETUP') {
        await tx.restaurant.update({
          where: { id: restaurantId },
          data: { status: 'TRIAL' as any },
        });
      }
    });

    return {
      success: true,
      message: 'Onboarding completed successfully',
      redirect: '/dashboard',
    };
  }
}
