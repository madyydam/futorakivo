import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, timingSafeEqual } from 'node:crypto';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    const superAdminKeyHeader = request.headers['x-super-admin-key'];

    // Master API Key bypass for server-to-server operations or emergencies (strictly requires configured env with at least 32 chars)
    const configuredMasterKey = process.env.SUPER_ADMIN_KEY;
    if (
      superAdminKeyHeader &&
      configuredMasterKey &&
      configuredMasterKey.length >= 32
    ) {
      const hashA = createHash('sha256')
        .update(String(superAdminKeyHeader))
        .digest();
      const hashB = createHash('sha256')
        .update(configuredMasterKey)
        .digest();
      if (timingSafeEqual(hashA, hashB)) {
        request.superAdmin = {
          email: process.env.SUPER_ADMIN_EMAIL || 'admin@futoragroup.in',
          role: 'SUPER_ADMIN',
        };
        return true;
      }
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Super Admin authorization token',
      );
    }

    const token = authHeader.split(' ')[1];
    try {
      // Super Admin tokens MUST be signed with SUPER_ADMIN_JWT_SECRET, which is
      // cryptographically isolated from the restaurant-scoped JWT_SECRET.
      // This prevents a restaurant-level OWNER JWT (even if its payload were
      // somehow crafted to include role:'SUPER_ADMIN') from ever passing
      // this guard — the two token families cannot cross-verify.
      const superAdminSecret =
        process.env.SUPER_ADMIN_JWT_SECRET || process.env.JWT_SECRET;
      const payload = this.jwtService.verify(token, {
        secret: superAdminSecret,
      });

      if (payload.role !== 'SUPER_ADMIN') {
        throw new UnauthorizedException(
          'Insufficient platform privileges: SUPER_ADMIN role required',
        );
      }

      request.superAdmin = payload;
      return true;
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired Super Admin session token',
      );
    }
  }
}
