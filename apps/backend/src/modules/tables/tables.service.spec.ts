import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TableSessionStatus } from '@prisma/client';
import { TablesService } from './tables.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../../realtime/realtime.gateway';

describe('TablesService - Assignments & Sessions', () => {
  let service: TablesService;
  let prisma: any;
  let realtime: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
      },
      table: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      tableAssignment: {
        findMany: jest.fn(),
        createMany: jest.fn(),
        updateMany: jest.fn(),
      },
      tableSession: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
    };

    realtime = {
      emitToBranch: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TablesService,
        { provide: PrismaService, useValue: prisma },
        { provide: RealtimeGateway, useValue: realtime },
      ],
    }).compile();

    service = module.get<TablesService>(TablesService);
  });

  describe('assignTables', () => {
    it('throws NotFoundException if staff is not in the restaurant', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.assignTables(
          'rest-1',
          'branch-1',
          { tableIds: ['tbl-1'], staffUserId: 'u-missing' },
          'admin-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if tables do not belong to the branch', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'u-waiter', restaurantId: 'rest-1' });
      prisma.table.findMany.mockResolvedValue([{ id: 'tbl-1' }]); // 1 found out of 2

      await expect(
        service.assignTables(
          'rest-1',
          'branch-1',
          { tableIds: ['tbl-1', 'tbl-2'], staffUserId: 'u-waiter' },
          'admin-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('releases old assignments, creates new ones, and emits realtime update', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'u-waiter', restaurantId: 'rest-1' });
      prisma.table.findMany.mockResolvedValue([{ id: 'tbl-1' }, { id: 'tbl-2' }]);

      const result = await service.assignTables(
        'rest-1',
        'branch-1',
        { tableIds: ['tbl-1', 'tbl-2'], staffUserId: 'u-waiter' },
        'admin-1',
      );

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(prisma.tableAssignment.updateMany).toHaveBeenCalledWith({
        where: { outletId: 'branch-1', tableId: { in: ['tbl-1', 'tbl-2'] }, releasedAt: null },
        data: expect.objectContaining({ releasedAt: expect.any(Date) }),
      });
      expect(prisma.tableAssignment.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ tableId: 'tbl-1', staffUserId: 'u-waiter' }),
          expect.objectContaining({ tableId: 'tbl-2', staffUserId: 'u-waiter' }),
        ]),
      });
      expect(realtime.emitToBranch).toHaveBeenCalledWith(
        'branch-1',
        'table.assignments.updated',
        expect.objectContaining({ staffUserId: 'u-waiter' }),
      );
    });
  });

  describe('releaseTableAssignment', () => {
    it('releases assignment and clears assignedWaiterId', async () => {
      prisma.table.findFirst.mockResolvedValue({ id: 'tbl-1', floor: { branchId: 'branch-1' } });

      const res = await service.releaseTableAssignment('branch-1', 'tbl-1');
      expect(res.success).toBe(true);
      expect(prisma.tableAssignment.updateMany).toHaveBeenCalledWith({
        where: { outletId: 'branch-1', tableId: 'tbl-1', releasedAt: null },
        data: expect.objectContaining({ releasedAt: expect.any(Date) }),
      });
      expect(prisma.table.update).toHaveBeenCalledWith({
        where: { id: 'tbl-1' },
        data: { assignedWaiterId: null },
      });
    });
  });

  describe('Table Sessions', () => {
    it('returns existing session if one is active', async () => {
      prisma.table.findFirst.mockResolvedValue({ id: 'tbl-1' });
      const activeSession = { id: 'sess-1', status: TableSessionStatus.ACTIVE };
      prisma.tableSession.findFirst.mockResolvedValue(activeSession);

      const session = await service.getOrCreateActiveSession('rest-1', 'branch-1', 'tbl-1');
      expect(session).toEqual(activeSession);
      expect(prisma.tableSession.create).not.toHaveBeenCalled();
    });

    it('creates new session if none is active', async () => {
      prisma.table.findFirst.mockResolvedValue({ id: 'tbl-1' });
      prisma.tableSession.findFirst.mockResolvedValue(null);
      prisma.tableSession.create.mockImplementation((args: any) => ({
        id: 'new-sess-1',
        ...args.data,
      }));

      const session = await service.getOrCreateActiveSession('rest-1', 'branch-1', 'tbl-1');
      expect(session.id).toBe('new-sess-1');
      expect(session.status).toBe(TableSessionStatus.ACTIVE);
      expect(prisma.tableSession.create).toHaveBeenCalled();
    });

    it('closes active table session atomically via updateMany', async () => {
      prisma.tableSession.updateMany.mockResolvedValue({ count: 1 });

      const closed = await service.closeTableSession('rest-1', 'branch-1', 'tbl-1', 'user-1', 'Bill paid');
      expect(closed).toEqual({ closed: true, count: 1 });
      expect(prisma.tableSession.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: TableSessionStatus.ACTIVE }),
          data: expect.objectContaining({ status: TableSessionStatus.CLOSED }),
        }),
      );
    });
  });

  describe('Table Lifecycle & Guards', () => {
    it('throws BadRequestException if creating table with duplicate number on same floor', async () => {
      prisma.floor = { findFirst: jest.fn().mockResolvedValue({ id: 'flr-1' }) };
      prisma.table.findFirst.mockResolvedValue({ id: 'tbl-existing', number: 'T-10' });

      await expect(
        service.createTable('branch-1', {
          floorId: 'flr-1',
          number: '  T-10  ',
          capacity: 4,
          shape: 'RECTANGLE',
          x: 0,
          y: 0,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException if setting status to AVAILABLE while order is BILLED', async () => {
      prisma.table.findFirst.mockResolvedValue({ id: 'tbl-1', status: 'OCCUPIED' });
      prisma.order = {
        findFirst: jest.fn().mockResolvedValue({ orderNumber: '101', status: 'BILLED' }),
      };

      await expect(
        service.updateTableStatus('branch-1', 'tbl-1', 'AVAILABLE' as any),
      ).rejects.toThrow('This table has an active bill (#101, status BILLED) - settle or cancel it first');
    });

    it('throws ConflictException if deleting table with active OPEN or BILLED order', async () => {
      prisma.table.findFirst.mockResolvedValue({ id: 'tbl-1' });
      prisma.order = {
        findFirst: jest.fn().mockResolvedValue({ orderNumber: '102' }),
      };

      await expect(service.deleteTable('branch-1', 'tbl-1')).rejects.toThrow(
        'Cannot delete table with active order #102 - settle or cancel it first',
      );
    });
  });
});
