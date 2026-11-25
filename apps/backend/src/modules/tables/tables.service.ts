import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TableSessionStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type {
  AssignTablesDto,
  BulkTableCreateDto,
  FloorDto,
  FloorUpdateDto,
  TableDto,
  TableLayoutUpdateDto,
  TableStatusDto,
  TableUpdateDto,
} from '@futora/types';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../../realtime/realtime.gateway';

@Injectable()
export class TablesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  listFloors(branchId: string) {
    return this.prisma.floor.findMany({
      where: { branchId },
      orderBy: { sortOrder: 'asc' },
      include: {
        tables: {
          include: { assignedWaiter: { select: { id: true, name: true } } },
        },
      },
    });
  }

  createFloor(branchId: string, dto: FloorDto) {
    return this.prisma.floor.create({ data: { ...dto, branchId } });
  }

  async updateFloor(branchId: string, id: string, dto: FloorUpdateDto) {
    await this.assertFloorInBranch(branchId, id);
    return this.prisma.floor.update({ where: { id }, data: dto });
  }

  async createTable(branchId: string, dto: TableDto) {
    await this.assertFloorInBranch(branchId, dto.floorId);
    const tableNumber = dto.number.trim();
    const existing = await this.prisma.table.findFirst({
      where: { floorId: dto.floorId, number: tableNumber },
    });
    if (existing) {
      throw new BadRequestException(
        `Table number "${tableNumber}" already exists on this floor.`,
      );
    }
    const table = await this.prisma.table.create({
      data: { ...dto, number: tableNumber },
    });
    this.realtime.emitToBranch(branchId, 'table.updated', table);
    return table;
  }

  async createTables(branchId: string, dto: BulkTableCreateDto) {
    await this.assertFloorInBranch(branchId, dto.floorId);

    const numbers = dto.numbers.map((n) => n.trim()).filter(Boolean);
    const duplicatesInBatch = numbers.filter(
      (n, i) => numbers.indexOf(n) !== i,
    );
    if (duplicatesInBatch.length > 0) {
      throw new BadRequestException(
        `Table numbers must be unique: ${[...new Set(duplicatesInBatch)].join(', ')} ${duplicatesInBatch.length > 1 ? 'are' : 'is'} repeated.`,
      );
    }

    const existing = await this.prisma.table.findMany({
      where: { floorId: dto.floorId, number: { in: numbers } },
      select: { number: true },
    });
    if (existing.length > 0) {
      const clashes = existing.map((t) => t.number).join(', ');
      throw new BadRequestException(
        `These table numbers already exist on this floor: ${clashes}. Choose different numbers.`,
      );
    }

    const tables = await this.prisma.$transaction(
      numbers.map((number, index) =>
        this.prisma.table.create({
          data: {
            floorId: dto.floorId,
            number,
            capacity: dto.capacity,
            shape: dto.shape,
            color: dto.color,
            posX: 20 + (index % 5) * 100,
            posY: 20 + Math.floor(index / 5) * 100,
          },
        }),
      ),
    );
    tables.forEach((table) =>
      this.realtime.emitToBranch(branchId, 'table.updated', table),
    );
    return tables;
  }

  async updateTable(branchId: string, id: string, dto: TableUpdateDto) {
    await this.assertTableInBranch(branchId, id);
    try {
      const table = await this.prisma.table.update({
        where: { id },
        data: {
          ...dto,
          ...(dto.number !== undefined ? { number: dto.number.trim() } : {}),
        },
      });
      this.realtime.emitToBranch(branchId, 'table.updated', table);
      return table;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new BadRequestException(
          `Table number "${dto.number?.trim()}" already exists on this floor.`,
        );
      }
      throw err;
    }
  }

  async updateTableLayout(branchId: string, updates: TableLayoutUpdateDto[]) {
    const owned = await this.prisma.table.findMany({
      where: { id: { in: updates.map((u) => u.id) }, floor: { branchId } },
      select: { id: true },
    });
    if (owned.length !== updates.length) {
      throw new BadRequestException(
        'One or more tables are invalid for this branch',
      );
    }

    const results = await this.prisma.$transaction(
      updates.map(({ id, ...rest }) =>
        this.prisma.table.update({ where: { id }, data: rest }),
      ),
    );
    this.realtime.emitToBranch(branchId, 'table.layout.updated', results);
    return results;
  }

  async updateTableStatus(
    branchId: string,
    id: string,
    status: TableStatusDto,
    assignedWaiterId?: string,
    restaurantId?: string,
  ) {
    await this.assertTableInBranch(branchId, id);
    if (assignedWaiterId) {
      const staff = await this.prisma.user.findFirst({
        where: {
          id: assignedWaiterId,
          isActive: true,
          ...(restaurantId ? { restaurantId } : {}),
        },
        select: { id: true },
      });
      if (!staff) {
        throw new BadRequestException(
          'Assigned waiter is not an active staff member of this restaurant',
        );
      }
    }
    // A table with an unpaid bill cannot be marked free/reserved/cleaning by
    // hand - that is how a live order ended up hidden behind an "Available"
    // tile. Pay or cancel the bill first (both release the table themselves).
    if (status !== 'OCCUPIED') {
      const open = await this.prisma.order.findFirst({
        where: { tableId: id, status: { in: ['OPEN', 'BILLED'] } },
        select: { orderNumber: true, status: true },
      });
      if (open) {
        throw new ConflictException(
          `This table has an active bill (#${open.orderNumber}, status ${open.status}) - settle or cancel it first`,
        );
      }
    }
    const table = await this.prisma.table.update({
      where: { id },
      data: {
        status,
        statusSince: new Date(),
        ...(assignedWaiterId ? { assignedWaiterId } : {}),
      },
    });
    this.realtime.emitToBranch(branchId, 'table.updated', table);
    return table;
  }

  async deleteTable(branchId: string, id: string) {
    await this.assertTableInBranch(branchId, id);
    const activeOrder = await this.prisma.order.findFirst({
      where: { tableId: id, status: { in: ['OPEN', 'BILLED'] } },
      select: { orderNumber: true },
    });
    if (activeOrder) {
      throw new ConflictException(
        `Cannot delete table with active order #${activeOrder.orderNumber} - settle or cancel it first`,
      );
    }
    await this.prisma.table.delete({ where: { id } });
    this.realtime.emitToBranch(branchId, 'table.deleted', { id });
    return { ok: true };
  }

  async rotateQrToken(branchId: string, id: string) {
    const table = await this.prisma.table.findFirst({
      where: { id, floor: { branchId } },
    });
    if (!table) throw new NotFoundException('Table not found');

    // opaque, unguessable token — not the table's own id, so a leaked QR
    // image can't be used to enumerate other tables' ids/data
    const qrToken = randomBytes(16).toString('hex');
    return this.prisma.table.update({ where: { id }, data: { qrToken } });
  }

  private async assertFloorInBranch(branchId: string, floorId: string) {
    const floor = await this.prisma.floor.findFirst({
      where: { id: floorId, branchId },
    });
    if (!floor) throw new NotFoundException('Floor not found');
  }

  private async assertTableInBranch(branchId: string, tableId: string) {
    const table = await this.prisma.table.findFirst({
      where: { id: tableId, floor: { branchId } },
    });
    if (!table) throw new NotFoundException('Table not found');
  }

  /** Open guest requests (call waiter / bring bill) for a branch. */
  listOpenRequests(branchId: string) {
    return this.prisma.tableRequest.findMany({
      where: { branchId, resolvedAt: null },
      include: { table: { select: { id: true, number: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async resolveRequest(branchId: string, id: string) {
    const request = await this.prisma.tableRequest.findFirst({
      where: { id, branchId },
    });
    if (!request) throw new NotFoundException('Request not found');
    const updated = await this.prisma.tableRequest.update({
      where: { id },
      data: { resolvedAt: new Date() },
    });
    this.realtime.emitToBranch(branchId, 'table.request', { id });
    return updated;
  }

  async assignTables(
    restaurantId: string,
    branchId: string,
    dto: AssignTablesDto,
    assignedBy: string,
  ) {
    const staff = await this.prisma.user.findFirst({
      where: { id: dto.staffUserId, restaurantId, isActive: true },
    });
    if (!staff) {
      throw new NotFoundException('Staff member not found in this restaurant');
    }

    const tables = await this.prisma.table.findMany({
      where: { id: { in: dto.tableIds }, floor: { branchId } },
      select: { id: true },
    });
    if (tables.length !== dto.tableIds.length) {
      throw new BadRequestException(
        'One or more tables are invalid for this branch',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.tableAssignment.updateMany({
        where: {
          outletId: branchId,
          tableId: { in: dto.tableIds },
          releasedAt: null,
        },
        data: { releasedAt: new Date() },
      });

      await tx.tableAssignment.createMany({
        data: dto.tableIds.map((tableId) => ({
          restaurantId,
          outletId: branchId,
          tableId,
          staffUserId: dto.staffUserId,
          assignedBy,
        })),
      });

      await tx.table.updateMany({
        where: { id: { in: dto.tableIds } },
        data: { assignedWaiterId: dto.staffUserId },
      });
    });

    this.realtime.emitToBranch(branchId, 'table.assignments.updated', {
      tableIds: dto.tableIds,
      staffUserId: dto.staffUserId,
    });

    return { success: true, count: dto.tableIds.length };
  }

  async releaseTableAssignment(branchId: string, tableId: string) {
    await this.assertTableInBranch(branchId, tableId);

    await this.prisma.$transaction(async (tx) => {
      await tx.tableAssignment.updateMany({
        where: { outletId: branchId, tableId, releasedAt: null },
        data: { releasedAt: new Date() },
      });

      await tx.table.update({
        where: { id: tableId },
        data: { assignedWaiterId: null },
      });
    });

    this.realtime.emitToBranch(branchId, 'table.assignments.updated', {
      tableId,
      staffUserId: null,
    });

    return { success: true };
  }

  async listActiveAssignments(branchId: string, staffUserId?: string) {
    return this.prisma.tableAssignment.findMany({
      where: {
        outletId: branchId,
        releasedAt: null,
        ...(staffUserId ? { staffUserId } : {}),
      },
      include: {
        table: { select: { id: true, number: true, name: true } },
        staffUser: { select: { id: true, name: true } },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async getOrCreateActiveSession(
    restaurantId: string,
    branchId: string,
    tableId: string,
  ) {
    await this.assertTableInBranch(branchId, tableId);

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.tableSession.findFirst({
        where: {
          outletId: branchId,
          tableId,
          status: TableSessionStatus.ACTIVE,
        },
        include: { guests: true, bills: true },
      });

      if (existing) {
        return existing;
      }

      return tx.tableSession.create({
        data: {
          restaurantId,
          outletId: branchId,
          tableId,
          status: TableSessionStatus.ACTIVE,
          openedAt: new Date(),
          expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6-hour idle session
        },
        include: { guests: true, bills: true },
      });
    });
  }

  async closeTableSession(
    restaurantId: string,
    branchId: string,
    tableId: string,
    closedBy: string,
    closedReason?: string,
  ) {
    // Atomic TOCTOU-safe close: updateMany with the ACTIVE status predicate
    // ensures only one concurrent caller wins the race to close the session.
    const result = await this.prisma.tableSession.updateMany({
      where: {
        outletId: branchId,
        tableId,
        status: TableSessionStatus.ACTIVE,
      },
      data: {
        status: TableSessionStatus.CLOSED,
        closedAt: new Date(),
        closedBy,
        closedReason: closedReason ?? 'Table cleared and settled',
      },
    });
    // Return count so callers can distinguish "already closed" (0) from "just closed" (1+).
    return result.count > 0 ? { closed: true, count: result.count } : null;
  }
}
