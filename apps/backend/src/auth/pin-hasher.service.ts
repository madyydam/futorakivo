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

  /**
   * Computes deterministic, peppered HMAC-SHA256 lookup hash for high-speed indexing.
   * Multi-tenant safe: binds restaurantId with the raw PIN so identical PINs across
   * different restaurants produce completely different hashes.
   */
  computeLookup(
    restaurantId: string,
    pin: string,
    pepperVersion = 'v1',
  ): string {
    const pepper = this.getPepper(pepperVersion);
    return crypto
      .createHmac('sha256', pepper)
      .update(`${restaurantId}:${pin}`)
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
   */
  async verifyPin(pin: string, pinHash: string): Promise<boolean> {
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
