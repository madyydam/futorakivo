import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      restaurant: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      onboardingProgress: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
      },
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<OnboardingService>(OnboardingService);
  });

  describe('getProgress', () => {
    it('throws NotFoundException if restaurant does not exist', async () => {
      prisma.restaurant.findUnique.mockResolvedValue(null);

      await expect(service.getProgress('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('creates initial progress record if none exists', async () => {
      prisma.restaurant.findUnique.mockResolvedValue({
        id: 'rest-1',
        name: 'Curry House',
        status: 'SETUP',
      });
      prisma.onboardingProgress.findUnique.mockResolvedValue(null);
      prisma.onboardingProgress.create.mockResolvedValue({
        restaurantId: 'rest-1',
        currentStep: 1,
        completedSteps: [],
        draftJson: {},
      });

      const res = await service.getProgress('rest-1');

      expect(res.currentStep).toBe(1);
      expect(res.completedSteps).toEqual([]);
      expect(prisma.onboardingProgress.create).toHaveBeenCalledWith({
        data: {
          restaurantId: 'rest-1',
          currentStep: 1,
          completedSteps: [],
          draftJson: {},
        },
      });
    });

    it('returns existing progress when found', async () => {
      prisma.restaurant.findUnique.mockResolvedValue({
        id: 'rest-1',
        name: 'Curry House',
        status: 'SETUP',
      });
      prisma.onboardingProgress.findUnique.mockResolvedValue({
        restaurantId: 'rest-1',
        currentStep: 3,
        completedSteps: [1, 2],
        draftJson: { profile: { name: 'Curry House' } },
      });

      const res = await service.getProgress('rest-1');

      expect(res.currentStep).toBe(3);
      expect(res.completedSteps).toEqual([1, 2]);
      expect(res.draftJson).toEqual({ profile: { name: 'Curry House' } });
    });
  });

  describe('updateProgress', () => {
    it('merges draft json and marks completed step atomically', async () => {
      prisma.restaurant.findUnique.mockResolvedValue({
        id: 'rest-1',
        name: 'Curry House',
        status: 'SETUP',
      });
      prisma.onboardingProgress.findUnique.mockResolvedValue({
        restaurantId: 'rest-1',
        currentStep: 2,
        completedSteps: [1],
        draftJson: { step1: { cuisine: 'Indian' } },
      });
      prisma.onboardingProgress.update.mockResolvedValue({
        restaurantId: 'rest-1',
        currentStep: 3,
        completedSteps: [1, 2],
        draftJson: { step1: { cuisine: 'Indian' }, step2: { outlet: 'Main' } },
      });

      const res = await service.updateProgress('rest-1', {
        currentStep: 3,
        completedStep: 2,
        draftJson: { step2: { outlet: 'Main' } },
      });

      expect(res.currentStep).toBe(3);
      expect(res.completedSteps).toEqual([1, 2]);
      expect(prisma.onboardingProgress.update).toHaveBeenCalledWith({
        where: { restaurantId: 'rest-1' },
        data: {
          currentStep: 3,
          completedSteps: [1, 2],
          draftJson: { step1: { cuisine: 'Indian' }, step2: { outlet: 'Main' } },
        },
      });
    });
  });

  describe('completeOnboarding', () => {
    it('upserts onboarding progress to step 11 and transitions SETUP status to TRIAL', async () => {
      prisma.restaurant.findUnique.mockResolvedValue({
        id: 'rest-1',
        status: 'SETUP',
      });

      const res = await service.completeOnboarding('rest-1');

      expect(res.success).toBe(true);
      expect(res.redirect).toBe('/dashboard');
      expect(prisma.onboardingProgress.upsert).toHaveBeenCalledWith({
        where: { restaurantId: 'rest-1' },
        create: {
          restaurantId: 'rest-1',
          currentStep: 11,
          completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
          draftJson: {},
        },
        update: {
          currentStep: 11,
          completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        },
      });
      expect(prisma.restaurant.update).toHaveBeenCalledWith({
        where: { id: 'rest-1' },
        data: { status: 'TRIAL' },
      });
    });
  });
});
