import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PinHasherService {
  private readonly pepperV1: string;

  constructor(private readonly config: ConfigService) {
    this.pepperV1 = this.config.get<string>(
      'SERVER_PEPPER_V1',
      'kivoko-default-secret-pepper-change-in-production-v1-min32bytes',
    );
  }

  private static readonly DUMMY_HASH =
    '$2b$12$e8rG6v09m8XzFm0q9N7qEuK7d2kLpU3x1j0y9q8w7e6r5t4y3u2i1';

  /**
   * Computes deterministic, peppered HMAC-SHA256 lookup hash for high-speed indexing.
   * Multi-tenant safe: binds restaurantId with the raw PIN using length-prefix framing
   * so identical PINs across different restaurants produce completely different hashes,
   * and boundary collision attacks are mathematically impossible.
   */
  computeLookup(
    restaurantId: string,
    pin: string,
    pepperVersion = 'v1',
  ): string {
    const pepper = this.getPepper(pepperVersion);
    return crypto
      .createHmac('sha256', pepper)
      .update(`${restaurantId.length}:${restaurantId}:${pin.length}:${pin}`)
      .digest('hex');
  }

  /**
   * Computes secure one-way salted hash for durable storage in user.pinHash.
   */
  async hashPin(pin: string): Promise<string> {
    return bcrypt.hash(pin, 12);
  }

  /**
   * Verifies a raw PIN against the stored pinHash.
   * To prevent timing attacks, if pinHash is missing or null, runs against a pre-computed
   * dummy bcrypt hash in constant time (~200ms) to ensure an attacker cannot measure
   * response duration differences to enumerate valid staff PINs.
   */
  async verifyPin(pin: string, pinHash?: string | null): Promise<boolean> {
    if (!pinHash) {
      await bcrypt.compare(pin, PinHasherService.DUMMY_HASH);
      return false;
    }
    return bcrypt.compare(pin, pinHash);
  }

  private getPepper(version: string): string {
    if (version === 'v1') return this.pepperV1;
    const custom = this.config.get<string>(
      `SERVER_PEPPER_${version.toUpperCase()}`,
    );
    if (custom) return custom;
    return this.pepperV1;
  }
}
