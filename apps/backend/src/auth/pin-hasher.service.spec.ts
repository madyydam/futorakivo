import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PinHasherService } from './pin-hasher.service';

describe('PinHasherService', () => {
  let service: PinHasherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PinHasherService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultVal: string) => defaultVal),
          },
        },
      ],
    }).compile();

    service = module.get<PinHasherService>(PinHasherService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('computeLookup', () => {
    it('produces deterministic output for the same restaurant and PIN', () => {
      const hash1 = service.computeLookup('rest-1', '123456');
      const hash2 = service.computeLookup('rest-1', '123456');
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });

    it('enforces multi-tenant isolation: different restaurants with identical PIN produce different hashes', () => {
      const hashA = service.computeLookup('rest-A', '123456');
      const hashB = service.computeLookup('rest-B', '123456');
      expect(hashA).not.toBe(hashB);
    });

    it('produces different hashes for different PINs in the same restaurant', () => {
      const hash1 = service.computeLookup('rest-1', '123456');
      const hash2 = service.computeLookup('rest-1', '654321');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('hashPin and verifyPin', () => {
    it('hashes and correctly verifies valid PIN', async () => {
      const hash = await service.hashPin('987654');
      expect(hash).toBeDefined();
      expect(hash).not.toBe('987654');

      const isValid = await service.verifyPin('987654', hash);
      expect(isValid).toBe(true);
    });

    it('rejects incorrect PIN', async () => {
      const hash = await service.hashPin('987654');
      const isValid = await service.verifyPin('111111', hash);
      expect(isValid).toBe(false);
    });

    it('neutralizes timing attacks by running dummy comparison when pinHash is null or undefined', async () => {
      const isValidNull = await service.verifyPin('123456', null);
      expect(isValidNull).toBe(false);

      const isValidUndef = await service.verifyPin('123456', undefined);
      expect(isValidUndef).toBe(false);
    });
  });
});
