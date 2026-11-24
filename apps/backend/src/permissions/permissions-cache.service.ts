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
  private readonly MAX_ENTRIES = 10_000; // Bound memory footprint under 10,000 tenants

  get(userId: string): UserPermissionCacheEntry | null {
    const entry = this.cache.get(userId);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.TTL_MS) {
      this.cache.delete(userId);
      return null;
    }
    // Refresh LRU position on access
    this.cache.delete(userId);
    this.cache.set(userId, entry);
    return entry;
  }

  set(userId: string, version: number, permissions: string[]): void {
    if (this.cache.size >= this.MAX_ENTRIES) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
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

  pruneExpired(): number {
    const now = Date.now();
    let count = 0;
    for (const [id, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.TTL_MS) {
        this.cache.delete(id);
        count++;
      }
    }
    return count;
  }
}
