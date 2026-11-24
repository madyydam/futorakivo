import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PinHasherService } from '../../auth/pin-hasher.service';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let prisma: any;
  let pinHasher: any;

  beforeEach(async () => {
    prisma = {
      restaurant: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      branch: {
        findFirst: jest.fn(),
        create: jest.fn().mockImplementation(({ data }: any) => ({ id: 'branch-1', ...data })),
        update: jest.fn().mockImplementation(({ where, data }: any) => ({ id: where.id, ...data })),
      },
      floor: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      table: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
      },
      menuCategory: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
      },
      menuItem: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      role: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([{ id: 'role-captain', name: 'CAPTAIN' }]),
      },
      user: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
      },
      onboardingProgress: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
      },
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
    };

    pinHasher = {
      computeLookup: jest.fn((restId, pin) => `lookup-${restId}-${pin}`),
      hashPin: jest.fn(async (pin) => `hashed-${pin}`),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        { provide: PrismaService, useValue: prisma },
        { provide: PinHasherService, useValue: pinHasher },
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

    it('sanitizes prototype pollution attempts in draftJson', async () => {
      prisma.restaurant.findUnique.mockResolvedValue({
        id: 'rest-1',
        name: 'Curry House',
        status: 'SETUP',
      });
      prisma.onboardingProgress.findUnique.mockResolvedValue({
        restaurantId: 'rest-1',
        currentStep: 1,
        completedSteps: [],
        draftJson: {},
      });
      prisma.onboardingProgress.update.mockResolvedValue({
        restaurantId: 'rest-1',
        currentStep: 2,
        completedSteps: [1],
        draftJson: { safeKey: 'valid' },
      });

      const maliciousPayload = JSON.parse(
        '{"safeKey":"valid","__proto__":{"polluted":true},"constructor":{"polluted":true}}',
      );

      await service.updateProgress('rest-1', {
        currentStep: 2,
        completedStep: 1,
        draftJson: maliciousPayload,
      });

      expect(prisma.onboardingProgress.update).toHaveBeenCalledWith({
        where: { restaurantId: 'rest-1' },
        data: expect.objectContaining({
          draftJson: { safeKey: 'valid' },
        }),
      });
      expect(({} as any).polluted).toBeUndefined();
    });
  });

  describe('completeOnboarding', () => {
    it('materializes restaurant, branch, tables, menu, staff with PINs and transitions status to TRIAL', async () => {
      const mockDraft = {
        name: 'Grand Spice Bistro',
        currency: 'INR',
        upiVpa: 'grandspice@icici',
        merchantName: 'GRAND SPICE BISTRO',
        outletName: 'Bandra Flagship',
        address: 'Linking Road, Bandra',
        phone: '+91 9876543210',
        gstin: '27AAAAA0000A1Z5',
        taxMode: 'INCLUSIVE',
        tables: [{ name: 'T-01', capacity: 4 }, { name: 'T-02', capacity: 2 }],
        items: [
          { name: 'Paneer Tikka', category: 'Starters', price: 280, tax: 5 },
          { name: 'Butter Naan', category: 'Breads', price: 60, tax: 5 },
        ],
        staff: [
          { name: 'Vikram Malhotra', role: 'OWNER', pin: '111111' },
          { name: 'Rahul Sharma', role: 'CAPTAIN', pin: '222222' },
        ],
      };

      prisma.onboardingProgress.findUnique.mockResolvedValue({
        restaurantId: 'rest-1',
        draftJson: mockDraft,
      });

      prisma.branch.findFirst.mockResolvedValue({
        id: 'branch-1',
        restaurantId: 'rest-1',
        name: 'Main Branch',
      });

      prisma.floor.findFirst.mockResolvedValue({
        id: 'floor-1',
        branchId: 'branch-1',
        name: 'Main Dining Hall',
      });

      prisma.menuCategory.findMany.mockResolvedValue([]);
      prisma.menuCategory.findFirst.mockResolvedValue(null);
      prisma.menuCategory.create.mockImplementation(({ data }: any) => ({
        id: `cat-${data.name}`,
        ...data,
      }));

      prisma.menuItem.findFirst.mockResolvedValue(null);
      prisma.role.findMany.mockResolvedValue([{ id: 'role-captain', name: 'CAPTAIN' }]);
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.findFirst.mockResolvedValue(null);

      prisma.restaurant.findUnique.mockResolvedValue({
        id: 'rest-1',
        status: 'SETUP',
      });

      const res = await service.completeOnboarding('rest-1');

      expect(res.success).toBe(true);
      expect(res.redirect).toBe('/dashboard');

      // Verify Restaurant profile update
      expect(prisma.restaurant.update).toHaveBeenCalledWith({
        where: { id: 'rest-1' },
        data: expect.objectContaining({
          name: 'Grand Spice Bistro',
          currency: 'INR',
          upiVpa: 'grandspice@icici',
          upiPayeeName: 'GRAND SPICE BISTRO',
        }),
      });

      // Verify Branch update
      expect(prisma.branch.update).toHaveBeenCalledWith({
        where: { id: 'branch-1' },
        data: expect.objectContaining({
          name: 'Bandra Flagship',
          address: 'Linking Road, Bandra',
          phone: '+91 9876543210',
          gstNumber: '27AAAAA0000A1Z5',
          taxMode: 'INCLUSIVE',
        }),
      });

      // Verify Table creation
      expect(prisma.table.create).toHaveBeenCalledWith({
        data: {
          floorId: 'floor-1',
          number: 'T-01',
          name: 'T-01',
          capacity: 4,
        },
      });

      // Verify Menu Items creation
      expect(prisma.menuItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Paneer Tikka',
        }),
      });

      // Verify Staff creation with PIN hash and lookup
      expect(pinHasher.hashPin).toHaveBeenCalledWith('222222');
      expect(pinHasher.computeLookup).toHaveBeenCalledWith('rest-1', '222222', 'v1');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Rahul Sharma',
          roleId: 'role-captain',
          pinHash: 'hashed-222222',
          pinLookup: 'lookup-rest-1-222222',
        }),
      });

      // Verify status transition
      expect(prisma.restaurant.update).toHaveBeenCalledWith({
        where: { id: 'rest-1' },
        data: { status: 'TRIAL' },
      });
    });
  });
});
