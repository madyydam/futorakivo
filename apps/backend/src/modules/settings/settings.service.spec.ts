import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from '../../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: {
    restaurant: { findUnique: jest.Mock };
    branch: { findFirst: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      restaurant: { findUnique: jest.fn() },
      branch: { findFirst: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { record: jest.fn() } },
      ],
    }).compile();

    service = module.get(SettingsService);
  });

  it('preserves legitimate restaurant names containing "Bistro" in getDisplay() and get()', async () => {
    prisma.restaurant.findUnique.mockResolvedValue({
      id: 'rest-1',
      name: 'Royal Spice Bistro',
      legalName: 'Royal Spice Hospitality Pvt Ltd',
    });
    prisma.branch.findFirst.mockResolvedValue({
      id: 'branch-1',
      restaurantId: 'rest-1',
      name: 'Main Outlet',
    });

    const display = await service.getDisplay('rest-1', 'branch-1');
    expect(display.restaurant.name).toBe('Royal Spice Bistro');

    const full = await service.get('rest-1', 'branch-1');
    expect(full.restaurant.name).toBe('Royal Spice Bistro');
  });

  it('rebrands legacy NodeDr Bistro names without corrupting normal names', async () => {
    prisma.restaurant.findUnique.mockResolvedValue({
      id: 'rest-2',
      name: 'NodeDr Bistro (Demo)',
    });
    prisma.branch.findFirst.mockResolvedValue({
      id: 'branch-2',
      restaurantId: 'rest-2',
      name: 'Flagship',
    });

    const display = await service.getDisplay('rest-2', 'branch-2');
    expect(display.restaurant.name).toBe('KIVO - HORECA management simplified');
  });
});
