import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PinHasherService } from './pin-hasher.service';

jest.setTimeout(25000);

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

    it('throws on unknown or unconfigured pepper version', () => {
      expect(() => service.computeLookup('rest-1', '123456', 'v2')).toThrow(
        /Unknown or unconfigured PIN pepper version/,
      );
    });

    it('resolves SERVER_PEPPER_V2 when configured', async () => {
      const mod = await Test.createTestingModule({
        providers: [
          PinHasherService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string, defaultVal?: string) =>
                key === 'SERVER_PEPPER_V2'
                  ? 'custom-v2-pepper-secret-32-bytes-minimum'
                  : defaultVal,
              ),
            },
          },
        ],
      }).compile();
      const svcV2 = mod.get<PinHasherService>(PinHasherService);
      const h1 = svcV2.computeLookup('rest-1', '123456', 'v1');
      const h2 = svcV2.computeLookup('rest-1', '123456', 'v2');
      expect(h2).toHaveLength(64);
      expect(h2).not.toBe(h1);
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
