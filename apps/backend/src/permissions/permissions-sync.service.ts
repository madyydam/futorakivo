import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSIONS,
  STAFF_ROLES,
  type StaffRole,
} from '@futora/types';
import { PrismaService } from '../prisma/prisma.service';

// Roles this deep are meant to always hold every permission that exists —
// see DEFAULT_ROLE_PERMISSIONS in packages/types. RolePermission rows are
// normally only granted once, at signup/seed time. When a later release
// adds a new permission (e.g. kds.manage for the Kitchen Display module),
// every restaurant that signed up *before* that release never gets it
// backfilled — their OWNER silently loses access to the new nav tab/feature
// until someone creates a brand-new account, which is exactly the bug
// report this fixes: "Kitchen tab broken, but a new account worked".
const ALWAYS_FULL_ACCESS_ROLES = ['OWNER', 'ADMINISTRATOR'] as const;

// Roles that should receive a permission when it is first introduced into the system.
// Built dynamically from DEFAULT_ROLE_PERMISSIONS so any role intended to have a
// new capability gets it on release without overriding future admin modifications.
const GRANT_WHEN_CREATED: Record<string, string[]> = {};
for (const [role, perms] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
  if (ALWAYS_FULL_ACCESS_ROLES.includes(role as any)) continue;
  for (const perm of perms) {
    if (!GRANT_WHEN_CREATED[perm]) {
      GRANT_WHEN_CREATED[perm] = [];
    }
    if (!GRANT_WHEN_CREATED[perm].includes(role)) {
      GRANT_WHEN_CREATED[perm].push(role);
    }
  }
}

@Injectable()
export class PermissionsSyncService implements OnModuleInit {
  private readonly logger = new Logger(PermissionsSyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.sync();
  }

  async sync() {
    const known = new Set(
      (await this.prisma.permission.findMany({ select: { key: true } })).map(
        (p) => p.key,
      ),
    );
    for (const permission of PERMISSIONS) {
      const row = await this.prisma.permission.upsert({
        where: { key: permission.key },
        update: { label: permission.label, category: permission.category },
        create: permission,
      });
      const roleNames = GRANT_WHEN_CREATED[permission.key];
      if (roleNames && !known.has(permission.key)) {
        const roles = await this.prisma.role.findMany({
          where: { name: { in: roleNames } },
          select: { id: true },
        });
        await this.prisma.rolePermission.createMany({
          data: roles.map((r) => ({ roleId: r.id, permissionId: row.id })),
          skipDuplicates: true,
        });
        this.logger.log(
          `Granted new permission ${permission.key} to ${roles.length} ${roleNames.join('/')} role(s)`,
        );
      }
    }
    const allPermissions = await this.prisma.permission.findMany();

    // Ensure all restaurants have all standard STAFF_ROLES (e.g. newly introduced CAPTAIN role)
    const allRoles = await this.prisma.role.findMany({
      select: { restaurantId: true, name: true },
    });
    const rolesByRestaurant = new Map<string, Set<string>>();
    for (const r of allRoles) {
      if (!rolesByRestaurant.has(r.restaurantId)) {
        rolesByRestaurant.set(r.restaurantId, new Set());
      }
      rolesByRestaurant.get(r.restaurantId)!.add(r.name);
    }

    const allRestaurants = await this.prisma.restaurant.findMany({
      select: { id: true },
    });

    for (const restaurant of allRestaurants) {
      const existingNames = rolesByRestaurant.get(restaurant.id) ?? new Set();
      for (const roleName of STAFF_ROLES) {
        if (!existingNames.has(roleName)) {
          const newRole = await this.prisma.role.create({
            data: {
              restaurantId: restaurant.id,
              name: roleName,
              label: roleName.replace(/_/g, ' '),
            },
          });
          const defaultPermKeys = new Set(DEFAULT_ROLE_PERMISSIONS[roleName]);
          const matchingPerms = allPermissions.filter((p) =>
            defaultPermKeys.has(p.key as any),
          );
          if (matchingPerms.length > 0) {
            await this.prisma.rolePermission.createMany({
              data: matchingPerms.map((p) => ({
                roleId: newRole.id,
                permissionId: p.id,
              })),
              skipDuplicates: true,
            });
          }
          this.logger.log(
            `Provisioned missing role ${roleName} for restaurant ${restaurant.id}`,
          );
        }
      }
    }

    const roles = await this.prisma.role.findMany({
      where: { name: { in: [...ALWAYS_FULL_ACCESS_ROLES] } },
      include: { permissions: true },
    });

    for (const role of roles) {
      const grantedIds = new Set(role.permissions.map((p) => p.permissionId));
      const missing = allPermissions.filter((p) => !grantedIds.has(p.id));
      if (missing.length === 0) continue;

      await this.prisma.rolePermission.createMany({
        data: missing.map((p) => ({ roleId: role.id, permissionId: p.id })),
        skipDuplicates: true,
      });
      this.logger.log(
        `Backfilled ${missing.length} new permission(s) onto role ${role.id} (${role.name})`,
      );
    }
  }
}
