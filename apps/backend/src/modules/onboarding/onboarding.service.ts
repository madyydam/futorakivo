import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TaxMode } from '@prisma/client';
import type { UpdateOnboardingProgressDto } from '@futora/types';
import { PrismaService } from '../../prisma/prisma.service';
import { PinHasherService } from '../../auth/pin-hasher.service';

/**
 * Strips HTML tags and excessive whitespace to sanitize free-text inputs
 * against Stored XSS attacks in receipts, KDS screens, and reports.
 */
function sanitizeText(str?: unknown): string {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

/**
 * Recursively sanitizes JSON objects against prototype pollution keys (__proto__, constructor, prototype).
 */
function sanitizeDraftJson(input: any): any {
  if (!input || typeof input !== 'object') return input;
  if (Array.isArray(input)) return input.map(sanitizeDraftJson);
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(input)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    clean[key] = sanitizeDraftJson(value);
  }
  return clean;
}

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
   * Atomically saves step draft and updates completed step progression within an isolated transaction.
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

      const cleanIncomingDraft = dto.draftJson ? sanitizeDraftJson(dto.draftJson) : {};
      const mergedDraft = {
        ...((existing.draftJson as Record<string, any>) || {}),
        ...cleanIncomingDraft,
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
   * 2. Sanitizes text inputs against XSS and executes high-performance batch insertions.
   * 3. Marks onboarding completed and activates tenant status.
   */
  async completeOnboarding(restaurantId: string) {
    const allSteps = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

    const progress = await this.prisma.onboardingProgress.findUnique({
      where: { restaurantId },
    });

    const draft = ((progress?.draftJson as Record<string, any>) || {}) as Record<
      string,
      any
    >;

    // Pre-hash staff PINs outside the DB transaction so bcrypt CPU cost
    // never holds database row locks open.
    const hashedStaff: Array<{
      roleId: string;
      name: string;
      passwordHash: string;
      pinHash: string;
      pinLookup: string;
    }> = [];
    if (Array.isArray(draft.staff) && draft.staff.length > 0) {
      const [roles, existingUsers] = await Promise.all([
        this.prisma.role.findMany({ where: { restaurantId } }),
        this.prisma.user.findMany({
          where: { restaurantId },
          select: { name: true, pinLookup: true },
        }),
      ]);
      const roleMap = new Map(roles.map((r) => [r.name.toUpperCase(), r.id]));
      const existingNames = new Set(
        existingUsers.map((u) => u.name.toLowerCase()),
      );
      const existingPinLookups = new Set(
        existingUsers
          .map((u: any) => u.pinLookup)
          .filter((p): p is string => Boolean(p)),
      );

      const validStaff: Array<{
        roleId: string;
        staffName: string;
        pinStr: string;
        pinLookup: string;
      }> = [];
      for (const st of draft.staff) {
        if (st.role === 'OWNER') continue;

        const rawRole = String(st.role || 'WAITER').trim().toUpperCase();
        const roleName =
          rawRole === 'MANAGER' ? 'RESTAURANT_MANAGER' : rawRole;
        const roleId = roleMap.get(roleName);
        const staffName = sanitizeText(st.name);
        const pinStr = String(st.pin ?? '').trim();

        if (!roleId || !staffName || !pinStr) continue;
        if (existingNames.has(staffName.toLowerCase())) continue;

        const pinLookup = this.pinHasher.computeLookup(
          restaurantId,
          pinStr,
          'v1',
        );
        if (existingPinLookups.has(pinLookup)) continue;

        validStaff.push({ roleId, staffName, pinStr, pinLookup });
        existingNames.add(staffName.toLowerCase());
        existingPinLookups.add(pinLookup);
      }

      const computed = await Promise.all(
        validStaff.map(async (st) => {
          const pinHash = await this.pinHasher.hashPin(st.pinStr);
          return {
            roleId: st.roleId,
            name: st.staffName,
            passwordHash: pinHash,
            pinHash,
            pinLookup: st.pinLookup,
          };
        }),
      );
      hashedStaff.push(...computed);
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Update Restaurant Brand Profile & Payments with XSS sanitization
      const restaurantUpdateData: Prisma.RestaurantUpdateInput = {};
      if (draft.name) restaurantUpdateData.name = sanitizeText(draft.name);
      if (draft.currency) restaurantUpdateData.currency = sanitizeText(draft.currency).slice(0, 5);
      if (draft.upiVpa) restaurantUpdateData.upiVpa = sanitizeText(draft.upiVpa).toLowerCase();
      if (draft.merchantName) restaurantUpdateData.upiPayeeName = sanitizeText(draft.merchantName);

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
            name: draft.outletName ? sanitizeText(draft.outletName) : 'Main Flagship Branch',
          },
        });
      } else {
        const branchUpdateData: Prisma.BranchUpdateInput = {};
        if (draft.outletName) branchUpdateData.name = sanitizeText(draft.outletName);
        if (draft.address) branchUpdateData.address = sanitizeText(draft.address);
        if (draft.phone) branchUpdateData.phone = sanitizeText(draft.phone);
        if (draft.gstin) branchUpdateData.gstNumber = sanitizeText(draft.gstin).toUpperCase();
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

      // 3. High-Performance Batch Materialization of Dining Floors & Tables
      if (Array.isArray(draft.tables) && draft.tables.length > 0) {
        const floorBySection = new Map<string, { id: string; numbers: Set<string> }>();

        for (const tbl of draft.tables) {
          const sectionName = sanitizeText(tbl.section) || 'Main Dining Hall';
          const sectionKey = sectionName.toLowerCase();

          let floorEntry = floorBySection.get(sectionKey);
          if (!floorEntry) {
            let floor =
              sectionName === 'Main Dining Hall'
                ? await tx.floor.findFirst({ where: { branchId: branch.id } })
                : await tx.floor.findFirst({
                    where: { branchId: branch.id, name: sectionName },
                  });
            if (!floor || (sectionName !== 'Main Dining Hall' && floor.name.toLowerCase() !== sectionKey)) {
              floor = await tx.floor.create({
                data: {
                  branchId: branch.id,
                  name: sectionName,
                  sortOrder: floorBySection.size,
                },
              });
            }
            const existingTables = await tx.table.findMany({
              where: { floorId: floor.id },
              select: { number: true },
            });
            floorEntry = {
              id: floor.id,
              numbers: new Set(existingTables.map((t) => t.number.toLowerCase())),
            };
            floorBySection.set(sectionKey, floorEntry);
          }

          const tableNum = sanitizeText(tbl.name || tbl.number);
          if (tableNum && !floorEntry.numbers.has(tableNum.toLowerCase())) {
            await tx.table.create({
              data: {
                floorId: floorEntry.id,
                number: tableNum,
                name: tableNum,
                capacity: Math.max(1, Math.min(50, Number(tbl.capacity) || 4)),
              },
            });
            floorEntry.numbers.add(tableNum.toLowerCase());
          }
        }
      }

      // 4. High-Performance Batch Materialization of Menu Categories & Menu Items
      if (Array.isArray(draft.items) && draft.items.length > 0) {
        const existingCats = await tx.menuCategory.findMany({
          where: { branchId: branch.id },
        });
        const catMap = new Map<string, string>(
          existingCats.map((c) => [c.name.toLowerCase(), c.id]),
        );

        for (const item of draft.items) {
          const catName = sanitizeText(item.category) || 'General';
          const catKey = catName.toLowerCase();

          if (!catMap.has(catKey)) {
            const cat = await tx.menuCategory.create({
              data: {
                branchId: branch.id,
                name: catName,
                isActive: true,
              },
            });
            catMap.set(catKey, cat.id);
          }

          const catId = catMap.get(catKey)!;
          const itemName = sanitizeText(item.name);

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
                  price: new Prisma.Decimal(Math.max(0, Number(item.price) || 100)),
                  taxRatePercent: new Prisma.Decimal(Math.max(0, Number(item.tax) || 5)),
                  ...(typeof item.isVeg === 'boolean' ? { isVeg: item.isVeg } : {}),
                },
              });
            }
          }
        }
      }

      // 5. Materialize Pre-Hashed Staff Members & Bind to Primary Branch
      for (const staffRecord of hashedStaff) {
        await tx.user.create({
          data: {
            restaurantId,
            roleId: staffRecord.roleId,
            name: staffRecord.name,
            passwordHash: staffRecord.passwordHash,
            pinHash: staffRecord.pinHash,
            pinLookup: staffRecord.pinLookup,
            pepperKeyId: 'v1',
            isActive: true,
            branches: { create: { branchId: branch.id } },
          },
        });
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
