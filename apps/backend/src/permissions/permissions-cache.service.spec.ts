import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsCacheService } from './permissions-cache.service';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { PERMISSIONS_KEY } from '../common/decorators/permissions.decorator';

describe('PermissionsCacheService & PermissionsGuard version invalidation', () => {
  let cache: PermissionsCacheService;

  beforeEach(() => {
    cache = new PermissionsCacheService();
  });

  describe('PermissionsCacheService', () => {
    it('should store and retrieve cached permissions', () => {
      cache.set('user-1', 1, ['menu.view', 'pos.access']);
      const entry = cache.get('user-1');
      expect(entry).not.toBeNull();
      expect(entry?.version).toBe(1);
      expect(entry?.permissions).toEqual(['menu.view', 'pos.access']);
    });

    it('should return null for non-existent user', () => {
      expect(cache.get('unknown-user')).toBeNull();
    });

    it('should invalidate specific user', () => {
      cache.set('user-1', 1, ['menu.view']);
      cache.invalidateUser('user-1');
      expect(cache.get('user-1')).toBeNull();
    });

    it('should invalidate multiple users', () => {
      cache.set('user-1', 1, ['menu.view']);
      cache.set('user-2', 1, ['pos.access']);
      cache.invalidateUsers(['user-1', 'user-2']);
      expect(cache.get('user-1')).toBeNull();
      expect(cache.get('user-2')).toBeNull();
    });

    it('should clear all entries', () => {
      cache.set('user-1', 1, ['menu.view']);
      cache.set('user-2', 2, ['pos.access']);
      cache.clear();
      expect(cache.get('user-1')).toBeNull();
      expect(cache.get('user-2')).toBeNull();
    });

    it('should evict expired entries when pruneExpired is called', () => {
      jest.useFakeTimers();
      cache.set('user-old', 1, ['menu.view']);
      jest.advanceTimersByTime(65_000); // Past 60s TTL
      cache.set('user-new', 1, ['menu.view']);

      const pruned = cache.pruneExpired();
      expect(pruned).toBe(1);
      expect(cache.get('user-old')).toBeNull();
      expect(cache.get('user-new')).not.toBeNull();
      jest.useRealTimers();
    });
  });

  describe('PermissionsGuard with cache', () => {
    let reflector: Reflector;
    let guard: PermissionsGuard;

    beforeEach(() => {
      reflector = new Reflector();
      guard = new PermissionsGuard(reflector, cache);
    });

    function mockContext(user: any, requiredPermissions: string[]): ExecutionContext {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requiredPermissions);
      return {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({ user }),
        }),
      } as unknown as ExecutionContext;
    }

    it('should allow access and populate cache on first check', () => {
      const user = {
        id: 'u-1',
        permissionsVersion: 1,
        permissions: ['menu.view'],
      };
      const ctx = mockContext(user, ['menu.view']);
      expect(guard.canActivate(ctx)).toBe(true);

      const cached = cache.get('u-1');
      expect(cached).not.toBeNull();
      expect(cached?.version).toBe(1);
    });

    it('should reject when user permissionsVersion is older than cached version', () => {
      // Simulate cache has version 2 (updated by admin)
      cache.set('u-1', 2, ['menu.view', 'pos.access']);

      // User token still has stale version 1
      const staleUser = {
        id: 'u-1',
        permissionsVersion: 1,
        permissions: ['menu.view'],
      };
      const ctx = mockContext(staleUser, ['menu.view']);

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should refresh stale cache and allow access when DB-backed user has newer permissionsVersion', () => {
      // Simulate stale cache holding version 1 (e.g. multi-worker or external bump)
      cache.set('u-1', 1, ['menu.view']);

      // User re-authenticated and JwtStrategy resolved DB version 2
      const freshUser = {
        id: 'u-1',
        permissionsVersion: 2,
        permissions: ['menu.view', 'orders.accept'],
      };
      const ctx = mockContext(freshUser, ['orders.accept']);

      expect(guard.canActivate(ctx)).toBe(true);
      const updatedCache = cache.get('u-1');
      expect(updatedCache?.version).toBe(2);
      expect(updatedCache?.permissions).toEqual(['menu.view', 'orders.accept']);
    });

    it('should reject when missing required permission', () => {
      const user = {
        id: 'u-1',
        permissionsVersion: 1,
        permissions: ['menu.view'],
      };
      const ctx = mockContext(user, ['orders.accept']);

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should allow access without user if no permissions are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
      const ctx = {
        getHandler: () => ({}),
        getClass: () => ({}),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });
});
