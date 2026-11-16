import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { round3, round4 } from '../../common/money';
import { StockService } from './stock.service';
import { StockIndentStatus } from '@prisma/client';

export interface CreateIndentDto {
  sourceBranchId: string;
  targetBranchId: string;
  urgency?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  notes?: string;
  items: {
    ingredientName: string;
    unit: string;
    requestedQty: number;
    notes?: string;
  }[];
}

export interface DispatchIndentDto {
  dispatchVehicle?: string;
  dispatchNotes?: string;
  items?: {
    id: string;
    dispatchedQty: number;
  }[];
}

export interface ReceiveIndentDto {
  items: {
    id: string;
    receivedQty: number;
    notes?: string;
  }[];
}

@Injectable()
export class IndentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stock: StockService,
  ) {}

  async listIndents(
    restaurantId: string,
    filter?: { branchId?: string; status?: StockIndentStatus },
  ) {
    const where: any = { restaurantId };
    if (filter?.status) {
      where.status = filter.status;
    }
    if (filter?.branchId) {
      where.OR = [
        { sourceBranchId: filter.branchId },
        { targetBranchId: filter.branchId },
      ];
    }

    return this.prisma.stockIndent.findMany({
      where,
      include: {
        sourceBranch: { select: { id: true, name: true, isCentralKitchen: true } },
        targetBranch: { select: { id: true, name: true, isCentralKitchen: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 150,
    });
  }

  async getIndent(restaurantId: string, id: string) {
    const indent = await this.prisma.stockIndent.findFirst({
      where: { id, restaurantId },
      include: {
        sourceBranch: true,
        targetBranch: true,
        items: true,
      },
    });
    if (!indent) throw new NotFoundException('Stock indent not found');
    return indent;
  }

  async createIndent(
    restaurantId: string,
    userId: string,
    userName: string | undefined,
    dto: CreateIndentDto,
  ) {
    if (dto.sourceBranchId === dto.targetBranchId) {
      throw new BadRequestException('Requesting outlet and supplying outlet must be different');
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('At least one item is required in the indent');
    }

    const [source, target] = await Promise.all([
      this.prisma.branch.findFirst({ where: { id: dto.sourceBranchId, restaurantId } }),
      this.prisma.branch.findFirst({ where: { id: dto.targetBranchId, restaurantId } }),
    ]);

    if (!source || !target) {
      throw new BadRequestException('Invalid branches selected for indent');
    }

    const yearMonth = new Date().toISOString().slice(2, 7).replace('-', '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const indentNumber = `IND-${yearMonth}-${randomSuffix}`;

    return this.prisma.stockIndent.create({
      data: {
        restaurantId,
        indentNumber,
        sourceBranchId: dto.sourceBranchId,
        targetBranchId: dto.targetBranchId,
        urgency: dto.urgency ?? 'NORMAL',
        requestedById: userId,
        requestedByName: userName ?? 'Store Staff',
        notes: dto.notes,
        status: StockIndentStatus.PENDING,
        items: {
          create: dto.items.map((item) => ({
            ingredientName: item.ingredientName,
            unit: item.unit,
            requestedQty: item.requestedQty,
            notes: item.notes,
          })),
        },
      },
      include: {
        sourceBranch: { select: { id: true, name: true } },
        targetBranch: { select: { id: true, name: true } },
        items: true,
      },
    });
  }

  async approveIndent(restaurantId: string, userId: string, id: string) {
    const indent = await this.getIndent(restaurantId, id);
    if (indent.status !== StockIndentStatus.PENDING) {
      throw new BadRequestException(`Cannot approve indent in ${indent.status} state`);
    }

    return this.prisma.stockIndent.update({
      where: { id },
      data: {
        status: StockIndentStatus.APPROVED,
        approvedById: userId,
        approvedAt: new Date(),
      },
      include: {
        sourceBranch: true,
        targetBranch: true,
        items: true,
      },
    });
  }

  async dispatchIndent(
    restaurantId: string,
    userId: string,
    id: string,
    dto: DispatchIndentDto,
  ) {
    const indent = await this.getIndent(restaurantId, id);
    if (
      indent.status !== StockIndentStatus.PENDING &&
      indent.status !== StockIndentStatus.APPROVED
    ) {
      throw new BadRequestException(`Cannot dispatch indent in ${indent.status} state`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Update dispatched qty on items
      for (const item of indent.items) {
        const itemUpdate = dto.items?.find((i) => i.id === item.id);
        const dispatchedQty = itemUpdate ? itemUpdate.dispatchedQty : Number(item.requestedQty);

        // Deduct from Central Kitchen/Target branch inventory if ingredient exists
        const targetIngredient = await tx.ingredient.findFirst({
          where: { branchId: indent.targetBranchId, name: item.ingredientName },
        });

        let unitCost = 0;
        if (targetIngredient && Number(targetIngredient.currentStock) > 0) {
          try {
            const qtyToConsume = Math.min(dispatchedQty, Number(targetIngredient.currentStock));
            const portions = await this.stock.consumeStock(
              tx,
              indent.targetBranchId,
              targetIngredient.id,
              qtyToConsume,
              {
                type: 'ADJUSTMENT',
                note: `Indent dispatch #${indent.indentNumber} to ${indent.sourceBranch.name}`,
                userId,
              },
            );
            if (portions.length > 0) {
              const totalCost = portions.reduce((s, p) => s + p.quantity * p.unitCost, 0);
              unitCost = round4(totalCost / portions.reduce((s, p) => s + p.quantity, 0));
            } else {
              unitCost = Number(targetIngredient.costPerUnit || 0);
            }
          } catch {
            unitCost = Number(targetIngredient.costPerUnit || 0);
          }
        }

        await tx.stockIndentItem.update({
          where: { id: item.id },
          data: {
            dispatchedQty,
            unitCost: unitCost || 0,
          },
        });
      }

      return tx.stockIndent.update({
        where: { id },
        data: {
          status: StockIndentStatus.DISPATCHED,
          dispatchedById: userId,
          dispatchedAt: new Date(),
          dispatchVehicle: dto.dispatchVehicle,
          dispatchNotes: dto.dispatchNotes,
        },
        include: {
          sourceBranch: true,
          targetBranch: true,
          items: true,
        },
      });
    });
  }

  async receiveIndent(
    restaurantId: string,
    userId: string,
    id: string,
    dto: ReceiveIndentDto,
  ) {
    const indent = await this.getIndent(restaurantId, id);
    if (indent.status !== StockIndentStatus.DISPATCHED) {
      throw new BadRequestException('Only DISPATCHED indents can be received');
    }

    return this.prisma.$transaction(async (tx) => {
      for (const item of indent.items) {
        const receivedItem = dto.items.find((i) => i.id === item.id);
        const receivedQty = receivedItem ? receivedItem.receivedQty : Number(item.dispatchedQty ?? item.requestedQty);

        await tx.stockIndentItem.update({
          where: { id: item.id },
          data: {
            receivedQty,
            notes: receivedItem?.notes ?? item.notes,
          },
        });

        if (receivedQty > 0) {
          // Find or create the ingredient in the destination branch
          let destIngredient = await tx.ingredient.findFirst({
            where: { branchId: indent.sourceBranchId, name: item.ingredientName },
          });

          if (!destIngredient) {
            destIngredient = await tx.ingredient.create({
              data: {
                branchId: indent.sourceBranchId,
                name: item.ingredientName,
                unit: (item.unit as any) || 'KG',
                currentStock: 0,
                costPerUnit: item.unitCost ? Number(item.unitCost) : 0,
              },
            });
          }

          // Create stock batch in receiving branch
          const batch = await tx.stockBatch.create({
            data: {
              branchId: indent.sourceBranchId,
              ingredientId: destIngredient.id,
              batchNumber: `IND-${indent.indentNumber}-${Date.now().toString(36).toUpperCase()}`,
              quantityReceived: receivedQty,
              quantityRemaining: receivedQty,
              unitCost: item.unitCost ? Number(item.unitCost) : Number(destIngredient.costPerUnit),
            },
          });

          // Create movement log
          await tx.stockMovement.create({
            data: {
              branchId: indent.sourceBranchId,
              ingredientId: destIngredient.id,
              batchId: batch.id,
              type: 'RECEIPT',
              quantity: receivedQty,
              note: `Indent receipt #${indent.indentNumber} from ${indent.targetBranch.name}`,
              createdById: userId,
            },
          });

          // Recalculate weighted cost & stock
          const oldQty = Math.max(0, Number(destIngredient.currentStock));
          const newQty = round3(oldQty + receivedQty);
          const uCost = Number(batch.unitCost);
          const avg = round4(
            (oldQty * Number(destIngredient.costPerUnit) + receivedQty * uCost) / (newQty || 1),
          );

          await tx.ingredient.update({
            where: { id: destIngredient.id },
            data: {
              currentStock: newQty,
              costPerUnit: avg,
            },
          });
        }
      }

      return tx.stockIndent.update({
        where: { id },
        data: {
          status: StockIndentStatus.RECEIVED,
          receivedById: userId,
          receivedAt: new Date(),
        },
        include: {
          sourceBranch: true,
          targetBranch: true,
          items: true,
        },
      });
    });
  }

  async rejectIndent(
    restaurantId: string,
    userId: string,
    id: string,
    reason: string,
  ) {
    const indent = await this.getIndent(restaurantId, id);
    if (indent.status === StockIndentStatus.RECEIVED || indent.status === StockIndentStatus.REJECTED) {
      throw new BadRequestException(`Cannot reject indent in ${indent.status} state`);
    }

    return this.prisma.stockIndent.update({
      where: { id },
      data: {
        status: StockIndentStatus.REJECTED,
        rejectionReason: reason,
      },
      include: {
        sourceBranch: true,
        targetBranch: true,
        items: true,
      },
    });
  }

  async toggleCentralKitchen(
    restaurantId: string,
    branchId: string,
    isCentralKitchen: boolean,
  ) {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, restaurantId },
    });
    if (!branch) throw new NotFoundException('Branch not found');

    return this.prisma.branch.update({
      where: { id: branchId },
      data: { isCentralKitchen },
      select: {
        id: true,
        name: true,
        isCentralKitchen: true,
        address: true,
      },
    });
  }

  async listCentralKitchens(restaurantId: string) {
    return this.prisma.branch.findMany({
      where: { restaurantId, isCentralKitchen: true, isActive: true },
      select: {
        id: true,
        name: true,
        isCentralKitchen: true,
        address: true,
        phone: true,
      },
      orderBy: { name: 'asc' },
    });
  }
}
