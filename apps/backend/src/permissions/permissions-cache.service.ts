import { Injectable } from '@nestjs/common';

export interface UserPermissionCacheEntry {
  version: number;
  permissions: string[];
  timestamp: number;
}

@Injectable()
export class PermissionsCacheService {
  private readonly cache = new Map<string, UserPermissionCacheEntry>();
  private readonly TTL_MS = 60_000; // 60-second in-memory fallback TTL

  get(userId: string): UserPermissionCacheEntry | null {
    const entry = this.cache.get(userId);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.TTL_MS) {
      this.cache.delete(userId);
      return null;
    }
    return entry;
  }

  set(userId: string, version: number, permissions: string[]): void {
    this.cache.set(userId, {
      version,
      permissions,
      timestamp: Date.now(),
    });
  }

  invalidateUser(userId: string): void {
    this.cache.delete(userId);
  }

  invalidateUsers(userIds: string[]): void {
    for (const id of userIds) {
      this.cache.delete(id);
    }
  }

  clear(): void {
    this.cache.clear();
  }
}
