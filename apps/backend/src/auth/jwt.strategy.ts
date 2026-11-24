import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { SessionUser } from '@futora/types';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {
  effectivePermissions,
  permissionInclude,
} from './effective-permissions';
import { PrismaService } from '../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  deviceId?: string;
  restaurantId?: string;
  pv?: number;
  isImpersonating?: boolean;
}

const cookieExtractor = (req: {
  cookies?: Record<string, string>;
}): string | null => {
  return req.cookies?.['nodedr_session'] ?? null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<SessionUser> {
    if (payload.deviceId) {
      const device = await this.prisma.deviceRegistration.findUnique({
        where: { id: payload.deviceId },
        select: { status: true },
      });
      if (!device || device.status !== 'APPROVED') {
        throw new UnauthorizedException('Terminal device has been revoked or is no longer approved');
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        ...permissionInclude,
        restaurant: {
          select: {
            id: true,
            status: true,
            isActivated: true,
            subscriptionExpiresAt: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Session no longer valid');
    }

    if (user.restaurant?.status === 'SUSPENDED' && !payload.isImpersonating) {
      throw new UnauthorizedException(
        'This restaurant account has been suspended by Super Admin.',
      );
    }

    return {
      id: user.id,
      restaurantId: user.restaurantId,
      name: user.name,
      roleId: user.roleId,
      roleName: user.role.name,
      permissions: effectivePermissions(user),
      permissionsVersion: user.permissionsVersion ?? 1,
    };
  }
}
