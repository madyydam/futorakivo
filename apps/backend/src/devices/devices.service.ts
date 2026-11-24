import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { DeviceStatus } from '@prisma/client';
import type { PairDeviceDto } from '@futora/types';
import { PrismaService } from '../prisma/prisma.service';

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
  constructor(private readonly prisma: PrismaService) {}

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

    const code = crypto.randomBytes(3).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const pairingCode = await this.prisma.devicePairingCode.create({
      data: {
        restaurantId,
        outletId,
        code,
        expiresAt,
        createdBy,
      },
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
    const codeRecord = await this.prisma.devicePairingCode.findFirst({
      where: {
        code: dto.code.trim().toUpperCase(),
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!codeRecord) {
      throw new BadRequestException('Invalid or expired device pairing code');
    }

    // Mark pairing code as consumed
    await this.prisma.devicePairingCode.update({
      where: { id: codeRecord.id },
      data: { usedAt: new Date() },
    });

    // Generate cryptographic 256-bit device bearer token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const device = await this.prisma.deviceRegistration.create({
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
      select: {
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
        failedAttempts: true,
        lockedUntil: true,
        createdAt: true,
      },
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

    return this.prisma.deviceRegistration.update({
      where: { id: deviceId },
      data: {
        status: DeviceStatus.APPROVED,
        approvedBy: approverId,
        approvedAt: new Date(),
      },
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
    });
  }
}
