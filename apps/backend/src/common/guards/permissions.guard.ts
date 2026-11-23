import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  permissionSatisfied,
  type PermissionKey,
} from '@futora/types';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import type { AuthenticatedRequest } from '../types/authenticated-request';
import { PermissionsCacheService } from '../../permissions/permissions-cache.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Optional() private readonly cache?: PermissionsCacheService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<PermissionKey[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('No authenticated user');
    }

    if (this.cache && user.id) {
      const cached = this.cache.get(user.id);
      if (
        cached &&
        user.permissionsVersion !== undefined &&
        cached.version !== user.permissionsVersion
      ) {
        throw new ForbiddenException(
          'Permissions have been modified. Please re-authenticate.',
        );
      }
      if (!cached && user.permissionsVersion !== undefined) {
        this.cache.set(user.id, user.permissionsVersion, user.permissions);
      }
    }

    const hasAll = required.every((permission) =>
      permissionSatisfied(user.permissions, permission),
    );
    if (!hasAll) {
      throw new ForbiddenException(
        `Missing permission: ${required.join(', ')}`,
      );
    }

    return true;
  }
}
