import { SetMetadata } from '@nestjs/common';
import type { PermissionKey } from '@futora/types';

export const REQUIRE_APPROVAL_KEY = 'requireApprovalPermission';

/**
 * Marks a controller action as requiring either direct permission OR manager approval.
 * If the current staff member has the permission, it passes immediately.
 * If not, the request must supply a valid `x-approval-token` header.
 */
export const RequireApproval = (permission: PermissionKey) =>
  SetMetadata(REQUIRE_APPROVAL_KEY, permission);
