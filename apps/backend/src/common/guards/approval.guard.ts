import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  permissionSatisfied,
  type PermissionKey,
} from '@futora/types';
import { REQUIRE_APPROVAL_KEY } from '../decorators/require-approval.decorator';
import type { AuthenticatedRequest } from '../types/authenticated-request';
import { ApprovalsService } from '../../approvals/approvals.service';

@Injectable()
export class ApprovalGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly approvals: ApprovalsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<PermissionKey>(
      REQUIRE_APPROVAL_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('No authenticated user');
    }

    // 1. Direct permission bypass:
    // If the authenticated user already holds the permission, proceed immediately
    if (permissionSatisfied(user.permissions, requiredPermission)) {
      return true;
    }

    // 2. Otherwise, valid manager approval token required
    const rawToken = request.headers['x-approval-token'] as string | undefined;
    if (!rawToken) {
      throw new ForbiddenException(
        `Manager approval required for ${requiredPermission}. Please enter manager PIN to authorize.`,
      );
    }

    const rawTarget =
      request.params?.id ||
      request.params?.orderId ||
      (request.body as any)?.orderId ||
      (request.body as any)?.targetId ||
      (request.query as any)?.orderId;
    const targetId = Array.isArray(rawTarget)
      ? rawTarget[0]
      : (rawTarget as string | undefined);

    const consumed = await this.approvals.consumeApprovalToken(
      user.restaurantId,
      rawToken,
      requiredPermission,
      targetId,
    );

    // Attach approver context to request
    (request as any).approvalContext = {
      approverId: consumed.approverId,
      consumedAt: consumed.consumedAt,
    };

    return true;
  }
}
