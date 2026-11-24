import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { ApprovalOutcome, DeviceStatus } from '@prisma/client';
import {
  permissionSatisfied,
  type PermissionKey,
  type RequestApprovalDto,
} from '@futora/types';
import { PrismaService } from '../prisma/prisma.service';
import { PinHasherService } from '../auth/pin-hasher.service';
import {
  effectivePermissions,
  permissionInclude,
} from '../auth/effective-permissions';

export interface IssueApprovalResult {
  approvalToken: string;
  approverName: string;
  expiresAt: Date;
}

@Injectable()
export class ApprovalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pinHasher: PinHasherService,
  ) {}

  /**
   * Manager or Owner enters their PIN to authorize a sensitive action on a staff terminal.
   * Generates a 2-minute single-use cryptographic token.
   */
  async requestApproval(params: {
    restaurantId: string;
    requesterId: string;
    deviceId?: string;
    dto: RequestApprovalDto;
  }): Promise<IssueApprovalResult> {
    const { restaurantId, requesterId, deviceId, dto } = params;

    // Resolve or provision valid deviceId for foreign key constraint & rate limiting
    let effectiveDeviceId = deviceId || dto.deviceId;
    if (!effectiveDeviceId) {
      const dev = await this.prisma.deviceRegistration.findFirst({
        where: { restaurantId },
        select: { id: true },
      });
      if (dev) {
        effectiveDeviceId = dev.id;
      } else {
        const branch = await this.prisma.branch.findFirst({
          where: { restaurantId },
          select: { id: true },
        });
        if (branch) {
          const sysDevice = await this.prisma.deviceRegistration.create({
            data: {
              restaurantId,
              outletId: branch.id,
              label: 'Web Dashboard Terminal',
              status: DeviceStatus.APPROVED,
            },
          });
          effectiveDeviceId = sysDevice.id;
        } else {
          effectiveDeviceId = 'system-device';
        }
      }
    }

    // Rate-limiting / brute-force lockout: 5 failed manager PIN attempts in 15 minutes locks approvals
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentFailedAttempts = this.prisma.approvalLog?.count
      ? await this.prisma.approvalLog.count({
          where: {
            restaurantId,
            outcome: ApprovalOutcome.DENIED,
            createdAt: { gte: fifteenMinutesAgo },
            OR: [
              { requesterId },
              ...(effectiveDeviceId ? [{ deviceId: effectiveDeviceId }] : []),
            ],
          },
        })
      : 0;

    if (recentFailedAttempts >= 5) {
      throw new UnauthorizedException(
        'Too many failed manager PIN attempts. Manager approval is temporarily locked for 15 minutes.',
      );
    }

    const pinLookup = this.pinHasher.computeLookup(
      restaurantId,
      dto.managerPin,
    );
    const approver = await this.prisma.user.findFirst({
      where: {
        restaurantId,
        pinLookup,
        isActive: true,
      },
      include: permissionInclude,
    });

    // Constant-time PIN verification to prevent timing attack enumeration of manager PINs
    const isPinValid = await this.pinHasher.verifyPin(
      dto.managerPin,
      approver?.pinHash,
    );

    if (!isPinValid || !approver) {
      if (this.prisma.approvalLog.create) {
        await this.prisma.approvalLog.create({
          data: {
            restaurantId,
            requesterId,
            approverId: requesterId,
            permissionKey: dto.permissionKey,
            targetEntity: dto.targetEntity,
            targetId: dto.targetId,
            reason: dto.reason ?? 'Failed manager PIN entry',
            deviceId: effectiveDeviceId,
            outcome: ApprovalOutcome.DENIED,
          },
        });
      }
      throw new UnauthorizedException('Invalid manager PIN');
    }

    // Verify approver holds the required permission
    const approverPermissions = effectivePermissions(approver);
    const hasPermission = permissionSatisfied(
      approverPermissions,
      dto.permissionKey as PermissionKey,
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        `The approving user does not possess the required permission: ${dto.permissionKey}`,
      );
    }

    // Owner PIN rule: payment settings changes require Owner role
    if (
      dto.permissionKey === 'qrsettings.payment' &&
      approver.role.name !== 'OWNER'
    ) {
      throw new ForbiddenException(
        'Payment QR and UPI changes require Owner PIN approval',
      );
    }

    // Generate single-use 256-bit token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const changeHash = dto.changePayload
      ? crypto
          .createHash('sha256')
          .update(JSON.stringify(dto.changePayload))
          .digest('hex')
      : '';

    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes TTL

    await this.prisma.approvalToken.create({
      data: {
        tokenHash,
        restaurantId,
        permissionKey: dto.permissionKey,
        targetEntity: dto.targetEntity,
        targetId: dto.targetId,
        changeHash,
        requesterId,
        approverId: approver.id,
        deviceId: effectiveDeviceId,
        expiresAt,
      },
    });

    await this.prisma.approvalLog.create({
      data: {
        restaurantId,
        requesterId,
        approverId: approver.id,
        permissionKey: dto.permissionKey,
        targetEntity: dto.targetEntity,
        targetId: dto.targetId,
        reason: dto.reason,
        deviceId: effectiveDeviceId,
        outcome: ApprovalOutcome.APPROVED,
      },
    });

    return {
      approvalToken: rawToken,
      approverName: approver.name,
      expiresAt,
    };
  }

  /**
   * Atomically consumes a single-use approval token.
   */
  async consumeApprovalToken(
    restaurantId: string,
    rawToken: string,
    permissionKey: string,
    targetId?: string,
  ) {
    if (!rawToken || rawToken.length < 32) {
      throw new ForbiddenException(
        'A valid manager approval token is required',
      );
    }

    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    return this.prisma.$transaction(async (tx) => {
      const record = await tx.approvalToken.findUnique({
        where: { tokenHash },
      });

      if (!record) {
        throw new ForbiddenException('Invalid manager approval token');
      }

      if (record.restaurantId !== restaurantId) {
        throw new ForbiddenException(
          'Approval token does not belong to this restaurant',
        );
      }

      if (record.permissionKey !== permissionKey) {
        throw new ForbiddenException(
          `Approval token was issued for ${record.permissionKey}, not ${permissionKey}`,
        );
      }

      if (record.consumedAt) {
        throw new ForbiddenException(
          'Manager approval token has already been consumed (single-use only)',
        );
      }

      if (record.expiresAt < new Date()) {
        throw new ForbiddenException(
          'Manager approval token has expired (2-minute limit)',
        );
      }

      if (targetId && record.targetId !== targetId) {
        throw new ForbiddenException(
          `Approval token target mismatch: token was issued for ${record.targetId}, but requested for ${targetId}`,
        );
      }

      // Mark token as consumed
      const updatedToken = await tx.approvalToken.update({
        where: { id: record.id },
        data: { consumedAt: new Date() },
      });

      // Update approval log outcome to USED
      await tx.approvalLog.updateMany({
        where: {
          restaurantId,
          targetId: record.targetId,
          permissionKey: record.permissionKey,
          approverId: record.approverId,
          outcome: ApprovalOutcome.APPROVED,
        },
        data: { outcome: ApprovalOutcome.USED },
      });

      return updatedToken;
    });
  }
}
