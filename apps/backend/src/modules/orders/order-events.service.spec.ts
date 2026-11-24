import { Test, TestingModule } from '@nestjs/testing';
import { OrderEventsService } from './order-events.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('OrderEventsService', () => {
  let service: OrderEventsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      orderEvent: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderEventsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<OrderEventsService>(OrderEventsService);
  });

  it('records an immutable order event', async () => {
    const mockCreated = {
      id: 'evt-1',
      restaurantId: 'rest-1',
      outletId: 'branch-1',
      entity: 'Order',
      entityId: 'ord-100',
      eventType: 'CREATED',
      actorType: 'STAFF',
      actorId: 'user-waiter-1',
      createdAt: new Date(),
    };
    prisma.orderEvent.create.mockResolvedValue(mockCreated);

    const result = await service.record({
      restaurantId: 'rest-1',
      outletId: 'branch-1',
      entity: 'Order',
      entityId: 'ord-100',
      eventType: 'CREATED',
      actorType: 'STAFF',
      actorId: 'user-waiter-1',
      afterState: { total: 45000 },
    });

    expect(result).toEqual(mockCreated);
    expect(prisma.orderEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          restaurantId: 'rest-1',
          entityId: 'ord-100',
          eventType: 'CREATED',
        }),
      }),
    );
  });

  it('safely catches and logs error without crashing caller', async () => {
    prisma.orderEvent.create.mockRejectedValue(new Error('DB failure'));

    const result = await service.record({
      restaurantId: 'rest-1',
      outletId: 'branch-1',
      entity: 'Order',
      entityId: 'ord-100',
      eventType: 'CREATED',
      actorType: 'STAFF',
    });

    expect(result).toBeNull();
  });

  it('lists event history for an entity', async () => {
    const mockEvents = [
      { id: 'e1', eventType: 'CREATED' },
      { id: 'e2', eventType: 'KOT_SENT' },
    ];
    prisma.orderEvent.findMany.mockResolvedValue(mockEvents);

    const history = await service.listEvents('rest-1', 'ord-100');
    expect(history).toHaveLength(2);
    expect(prisma.orderEvent.findMany).toHaveBeenCalledWith({
      where: { restaurantId: 'rest-1', entityId: 'ord-100' },
      orderBy: { createdAt: 'asc' },
    });
  });
});
