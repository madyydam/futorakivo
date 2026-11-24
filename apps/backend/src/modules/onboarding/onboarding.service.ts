import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TaxMode } from '@prisma/client';
import type { UpdateOnboardingProgressDto } from '@futora/types';
import { PrismaService } from '../../prisma/prisma.service';
import { PinHasherService } from '../../auth/pin-hasher.service';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pinHasher: PinHasherService,
  ) {}

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
   * Atomically saves step draft and updates completed step progression within a transaction.
   */
  async updateProgress(
    restaurantId: string,
    dto: UpdateOnboardingProgressDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const restaurant = await tx.restaurant.findUnique({
        where: { id: restaurantId },
        select: { id: true, name: true, status: true },
      });
      if (!restaurant) {
        throw new NotFoundException('Restaurant not found');
      }

      let existing = await tx.onboardingProgress.findUnique({
        where: { restaurantId },
      });

      if (!existing) {
        existing = await tx.onboardingProgress.create({
          data: {
            restaurantId,
            currentStep: 1,
            completedSteps: [],
            draftJson: {},
          },
        });
      }

      const completedSet = new Set(existing.completedSteps);
      if (dto.completedStep) {
        completedSet.add(dto.completedStep);
      }

      const mergedDraft = {
        ...((existing.draftJson as Record<string, any>) || {}),
        ...(dto.draftJson || {}),
      };

      const updated = await tx.onboardingProgress.update({
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
        restaurant,
      };
    });
  }

  /**
   * Finalizes the 11-step onboarding wizard:
   * 1. Materializes restaurant profile, outlet, taxes, menu, tables, and staff into the database.
   * 2. Marks onboarding completed and activates tenant status.
   */
  async completeOnboarding(restaurantId: string) {
    const allSteps = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

    await this.prisma.$transaction(async (tx) => {
      const progress = await tx.onboardingProgress.findUnique({
        where: { restaurantId },
      });

      const draft = ((progress?.draftJson as Record<string, any>) || {}) as Record<string, any>;

      // 1. Update Restaurant Brand Profile & Payments
      const restaurantUpdateData: Prisma.RestaurantUpdateInput = {};
      if (draft.name) restaurantUpdateData.name = String(draft.name);
      if (draft.currency) restaurantUpdateData.currency = String(draft.currency);
      if (draft.upiVpa) restaurantUpdateData.upiVpa = String(draft.upiVpa);
      if (draft.merchantName) restaurantUpdateData.upiPayeeName = String(draft.merchantName);

      if (Object.keys(restaurantUpdateData).length > 0) {
        await tx.restaurant.update({
          where: { id: restaurantId },
          data: restaurantUpdateData,
        });
      }

      // 2. Update Primary Branch Details & Taxes
      let branch = await tx.branch.findFirst({
        where: { restaurantId },
        orderBy: { id: 'asc' },
      });

      if (!branch) {
        branch = await tx.branch.create({
          data: {
            restaurantId,
            name: draft.outletName ? String(draft.outletName) : 'Main Flagship Branch',
          },
        });
      } else {
        const branchUpdateData: Prisma.BranchUpdateInput = {};
        if (draft.outletName) branchUpdateData.name = String(draft.outletName);
        if (draft.address) branchUpdateData.address = String(draft.address);
        if (draft.phone) branchUpdateData.phone = String(draft.phone);
        if (draft.gstin) branchUpdateData.gstNumber = String(draft.gstin);
        if (draft.taxMode === 'INCLUSIVE' || draft.taxMode === 'EXCLUSIVE') {
          branchUpdateData.taxMode = draft.taxMode as TaxMode;
        }

        if (Object.keys(branchUpdateData).length > 0) {
          const updated = await tx.branch.update({
            where: { id: branch.id },
            data: branchUpdateData,
          });
          if (updated) {
            branch = updated;
          }
        }
      }

      // 3. Materialize Dining Floor & Tables
      if (Array.isArray(draft.tables) && draft.tables.length > 0) {
        let floor = await tx.floor.findFirst({
          where: { branchId: branch.id },
        });
        if (!floor) {
          floor = await tx.floor.create({
            data: {
              branchId: branch.id,
              name: 'Main Dining Hall',
              sortOrder: 0,
            },
          });
        }

        const existingTables = await tx.table.findMany({
          where: { floorId: floor.id },
          select: { number: true },
        });
        const existingNumbers = new Set(existingTables.map((t) => t.number));

        for (const tbl of draft.tables) {
          const tableNum = String(tbl.name || tbl.number || '').trim();
          if (tableNum && !existingNumbers.has(tableNum)) {
            await tx.table.create({
              data: {
                floorId: floor.id,
                number: tableNum,
                name: tableNum,
                capacity: Number(tbl.capacity) || 4,
              },
            });
            existingNumbers.add(tableNum);
          }
        }
      }

      // 4. Materialize Menu Categories & Menu Items
      if (Array.isArray(draft.items) && draft.items.length > 0) {
        const catMap = new Map<string, string>();

        for (const item of draft.items) {
          const catName = String(item.category || 'General').trim();
          if (!catMap.has(catName)) {
            let cat = await tx.menuCategory.findFirst({
              where: { branchId: branch.id, name: catName },
            });
            if (!cat) {
              cat = await tx.menuCategory.create({
                data: {
                  branchId: branch.id,
                  name: catName,
                  isActive: true,
                },
              });
            }
            catMap.set(catName, cat.id);
          }

          const catId = catMap.get(catName)!;
          const itemName = String(item.name || '').trim();

          if (itemName) {
            const existingItem = await tx.menuItem.findFirst({
              where: { branchId: branch.id, categoryId: catId, name: itemName },
            });

            if (!existingItem) {
              await tx.menuItem.create({
                data: {
                  branchId: branch.id,
                  categoryId: catId,
                  name: itemName,
                  price: new Prisma.Decimal(Number(item.price) || 100),
                  taxRatePercent: new Prisma.Decimal(Number(item.tax) || 5),
                },
              });
            }
          }
        }
      }

      // 5. Materialize Staff Members with Hashed PINs
      if (Array.isArray(draft.staff) && draft.staff.length > 0) {
        for (const st of draft.staff) {
          if (st.role === 'OWNER') continue; // Owner account is already initialized

          const roleName = String(st.role || 'WAITER').trim();
          const role = await tx.role.findFirst({
            where: { restaurantId, name: roleName },
          });

          if (role && st.name && st.pin) {
            const staffName = String(st.name).trim();
            const existingUser = await tx.user.findFirst({
              where: { restaurantId, name: staffName },
            });

            if (!existingUser) {
              const pinStr = String(st.pin).trim();
              const pinHash = await this.pinHasher.hashPin(pinStr);
              const pinLookup = this.pinHasher.computeLookup(restaurantId, pinStr, 'v1');

              await tx.user.create({
                data: {
                  restaurantId,
                  roleId: role.id,
                  name: staffName,
                  passwordHash: pinHash,
                  pinHash,
                  pinLookup,
                  pepperKeyId: 'v1',
                  isActive: true,
                },
              });
            }
          }
        }
      }

      // 6. Complete Onboarding Progress Record
      await tx.onboardingProgress.upsert({
        where: { restaurantId },
        create: {
          restaurantId,
          currentStep: 11,
          completedSteps: allSteps,
          draftJson: draft,
        },
        update: {
          currentStep: 11,
          completedSteps: allSteps,
        },
      });

      // 7. Transition Restaurant Status to TRIAL
      const currentRestaurant = await tx.restaurant.findUnique({
        where: { id: restaurantId },
        select: { status: true },
      });

      if (currentRestaurant && (currentRestaurant.status as string) === 'SETUP') {
        await tx.restaurant.update({
          where: { id: restaurantId },
          data: { status: 'TRIAL' as any },
        });
      }
    });

    return {
      success: true,
      message: 'Onboarding completed and tenant successfully materialized',
      redirect: '/dashboard',
    };
  }
}
