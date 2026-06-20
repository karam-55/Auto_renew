import { CacheService } from '../../api/services/cache.service';
import { Logger } from '../../infrastructure/logging/logger';

/**
 * Cache Wrapper Utility
 * Provides a simple caching layer on top of the existing CacheService
 * with automatic expiration and key generation.
 */

const DEFAULT_TTL = 300; // 5 minutes in seconds

export class CacheWrapper {
  /**
   * Get or set cache value
   */
  static async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds: number = DEFAULT_TTL
  ): Promise<T> {
    try {
      // Try to get from cache
      const cached = await CacheService.get(key);
      if (cached) {
        Logger.debug(`Cache HIT: ${key}`);
        return JSON.parse(cached);
      }
    } catch (error) {
      Logger.warn(`Cache read error for key ${key}`, { error: (error as Error).message });
    }

    // Generate value
    Logger.debug(`Cache MISS: ${key}`);
    const value = await factory();

    try {
      // Store in cache
      await CacheService.set(key, JSON.stringify(value), ttlSeconds);
    } catch (error) {
      Logger.warn(`Cache write error for key ${key}`, { error: (error as Error).message });
    }

    return value;
  }

  /**
   * Get value from cache
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await CacheService.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      Logger.warn(`Cache read error for key ${key}`, { error: (error as Error).message });
    }
    return null;
  }

  /**
   * Set value in cache
   */
  static async set(key: string, value: any, ttlSeconds: number = DEFAULT_TTL): Promise<void> {
    try {
      await CacheService.set(key, JSON.stringify(value), ttlSeconds);
    } catch (error) {
      Logger.warn(`Cache write error for key ${key}`, { error: (error as Error).message });
    }
  }

  /**
   * Delete value from cache
   */
  static async delete(key: string): Promise<void> {
    try {
      await CacheService.delete(key);
    } catch (error) {
      Logger.warn(`Cache delete error for key ${key}`, { error: (error as Error).message });
    }
  }

  /**
   * Generate cache key for tenant-scoped data
   */
  static tenantKey(tenantId: string, resource: string, identifier?: string): string {
    return identifier
      ? `tenant:${tenantId}:${resource}:${identifier}`
      : `tenant:${tenantId}:${resource}`;
  }

  /**
   * Invalidate all cache keys for a tenant
   */
  static async invalidateTenant(tenantId: string): Promise<void> {
    try {
      // This would need a pattern-based delete in Redis
      // For now, we log and individual keys should be invalidated
      Logger.info(`Cache invalidate for tenant: ${tenantId}`);
    } catch (error) {
      Logger.warn(`Cache invalidate error for tenant ${tenantId}`, { error: (error as Error).message });
    }
  }

  /**
   * Cache decorator for service methods
   * Usage:
   *   @CacheWrapper.cacheable('vehicles', 300)
   *   async getAllVehicles(tenantId: string) { ... }
   */
  static cacheable(resource: string, ttlSeconds: number = DEFAULT_TTL) {
    return function (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        // Assume first arg is tenantId for tenant-scoped methods
        const tenantId = args[0];
        if (!tenantId) {
          return originalMethod.apply(this, args);
        }

        const cacheKey = CacheWrapper.tenantKey(tenantId, resource, propertyKey);
        return CacheWrapper.getOrSet(cacheKey, () => originalMethod.apply(this, args), ttlSeconds);
      };

      return descriptor;
    };
  }
}
