import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { DeviceStatus } from '@prisma/client';
import type { PairDeviceDto } from '@futora/types';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

const DEVICE_PUBLIC_SELECT = {
  id: true,
  restaurantId: true,
  outletId: true,
  outlet: { select: { id: true, name: true } },
  label: true,
  status: true,
  userAgent: true,
  lastSeenAt: true,
  lastIp: true,
  approvedBy: true,
  approvedAt: true,
  revokedBy: true,
  revokedAt: true,
  failedAttempts: true,
  lockedUntil: true,
  createdAt: true,
} as const;

export interface PairedDeviceResult {
  deviceId: string;
  deviceToken: string;
  status: DeviceStatus;
  label: string;
  outletId: string;
  restaurantId: string;
}

@Injectable()
export class DevicesService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly audit?: AuditService,
  ) {}

  /**
   * Generates a 6-character random pairing code valid for 10 minutes.
   */
  async createPairingCode(
    restaurantId: string,
    outletId: string,
    createdBy: string,
  ) {
    const branch = await this.prisma.branch.findFirst({
      where: { id: outletId, restaurantId },
    });
    if (!branch) {
      throw new NotFoundException('Branch/outlet not found in this restaurant');
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let pairingCode: any;
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = crypto.randomBytes(3).toString('hex').toUpperCase();
      try {
        pairingCode = await this.prisma.devicePairingCode.create({
          data: {
            restaurantId,
            outletId,
            code,
            expiresAt,
            createdBy,
          },
        });
        break;
      } catch (err: any) {
        if (err?.code === 'P2002' && attempt < 4) continue;
        throw err;
      }
    }

    await this.audit?.record({
      userId: createdBy,
      action: 'create_pairing_code',
      entity: 'device',
      entityId: pairingCode.id,
      metadata: { outletId: pairingCode.outletId },
    });

    return {
      code: pairingCode.code,
      expiresAt: pairingCode.expiresAt,
      outletId: pairingCode.outletId,
    };
  }

  /**
   * Terminal exchanges an approved pairing code for a persistent 256-bit device token.
   */
  async pairDevice(
    dto: PairDeviceDto,
    ip = '127.0.0.1',
  ): Promise<PairedDeviceResult> {
    const sanitizedCode = dto.code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (sanitizedCode.length < 4) {
      throw new BadRequestException('Invalid or expired device pairing code');
    }
    const codeRecord = await this.prisma.devicePairingCode.findFirst({
      where: {
        code: sanitizedCode,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!codeRecord) {
      throw new BadRequestException('Invalid or expired device pairing code');
    }

    // Generate cryptographic 256-bit device bearer token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    // Atomically consume code and register device in one transaction to avoid partial failure
    const performPair = async (client: any) => {
      const consumed = await client.devicePairingCode.updateMany({
        where: { id: codeRecord.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (consumed.count === 0) {
        throw new BadRequestException('Invalid or expired device pairing code');
      }

      return client.deviceRegistration.create({
        data: {
          restaurantId: codeRecord.restaurantId,
          outletId: codeRecord.outletId,
          label: dto.label.trim(),
          status: DeviceStatus.APPROVED,
          tokenHash,
          userAgent: dto.userAgent ?? null,
          lastSeenAt: new Date(),
          lastIp: ip,
          approvedBy: codeRecord.createdBy,
          approvedAt: new Date(),
        },
      });
    };

    const device = this.prisma.$transaction
      ? await this.prisma.$transaction(performPair)
      : await performPair(this.prisma);

    return {
      deviceId: device.id,
      deviceToken: rawToken,
      status: device.status,
      label: device.label,
      outletId: device.outletId,
      restaurantId: device.restaurantId,
    };
  }

  /**
   * Validates raw device bearer token against the SHA-256 tokenHash in DB.
   */
  async verifyDeviceToken(rawToken: string) {
    if (!rawToken || rawToken.length < 32) return null;
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    return this.prisma.deviceRegistration.findUnique({
      where: { tokenHash },
      include: { outlet: true },
    });
  }

  /**
   * List all registered devices for a restaurant.
   */
  async listDevices(restaurantId: string) {
    return this.prisma.deviceRegistration.findMany({
      where: { restaurantId },
      select: DEVICE_PUBLIC_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Approves a pending device.
   */
  async approveDevice(
    restaurantId: string,
    deviceId: string,
    approverId: string,
  ) {
    const device = await this.prisma.deviceRegistration.findFirst({
      where: { id: deviceId, restaurantId },
    });
    if (!device) throw new NotFoundException('Device not found');
    if (device.status === DeviceStatus.REVOKED) {
      throw new BadRequestException(
        'Revoked devices cannot be re-approved; generate a new pairing code',
      );
    }

    return this.prisma.deviceRegistration.update({
      where: { id: deviceId },
      data: {
        status: DeviceStatus.APPROVED,
        approvedBy: approverId,
        approvedAt: new Date(),
      },
      select: DEVICE_PUBLIC_SELECT,
    });
  }

  /**
   * Revokes an approved device immediately.
   */
  async revokeDevice(
    restaurantId: string,
    deviceId: string,
    revokerId: string,
  ) {
    const device = await this.prisma.deviceRegistration.findFirst({
      where: { id: deviceId, restaurantId },
    });
    if (!device) throw new NotFoundException('Device not found');

    return this.prisma.deviceRegistration.update({
      where: { id: deviceId },
      data: {
        status: DeviceStatus.REVOKED,
        revokedBy: revokerId,
        revokedAt: new Date(),
        tokenHash: null, // Wipe token to ensure immediate cryptographic invalidation
      },
      select: DEVICE_PUBLIC_SELECT,
    });
  }

  /**
   * Clears lockout and resets failed attempts for a temporarily locked device.
   */
  async unlockDevice(
    restaurantId: string,
    deviceId: string,
    unlockedBy: string,
  ) {
    const device = await this.prisma.deviceRegistration.findFirst({
      where: { id: deviceId, restaurantId },
    });
    if (!device) throw new NotFoundException('Device not found');

    const updated = await this.prisma.deviceRegistration.update({
      where: { id: deviceId },
      data: {
        failedAttempts: 0,
        lockedUntil: null,
      },
      select: DEVICE_PUBLIC_SELECT,
    });

    await this.audit?.record({
      userId: unlockedBy,
      action: 'unlock',
      entity: 'device',
      entityId: deviceId,
      metadata: { outletId: updated.outletId },
    });

    return updated;
  }
}
