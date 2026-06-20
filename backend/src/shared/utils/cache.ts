import { Logger, LogContext } from '../../infrastructure/logging/logger';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  context?: LogContext;
}

export class CacheUtil {
  private static redisClient: any = null;
  private static isEnabled = false;

  static initialize(redisClient: any): void {
    this.redisClient = redisClient;
    this.isEnabled = !!redisClient;
    if (this.isEnabled) {
      Logger.info('Cache initialized with Redis');
    } else {
      Logger.warn('Cache disabled - Redis client not provided');
    }
  }

  static async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    if (!this.isEnabled) return null;

    try {
      const data = await this.redisClient.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      Logger.error('Cache get error', error, { key, ...options?.context });
      return null;
    }
  }

  static async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const serialized = JSON.stringify(value);
      if (options?.ttl) {
        await this.redisClient.setex(key, options.ttl, serialized);
      } else {
        await this.redisClient.set(key, serialized);
      }
    } catch (error) {
      Logger.error('Cache set error', error, { key, ...options?.context });
    }
  }

  static async del(key: string, options?: CacheOptions): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await this.redisClient.del(key);
    } catch (error) {
      Logger.error('Cache delete error', error, { key, ...options?.context });
    }
  }

  static async delPattern(pattern: string, options?: CacheOptions): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const keys = await this.redisClient.keys(pattern);
      if (keys.length > 0) {
        await this.redisClient.del(...keys);
      }
    } catch (error) {
      Logger.error('Cache delete pattern error', error, { pattern, ...options?.context });
    }
  }

  static async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    const value = await fn();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Cache key generators for common entities
   */
  static Keys = {
    report: (tenantId: string, reportId: string) => `report:${tenantId}:${reportId}`,
    inventoryValuation: (tenantId: string) => `inventory:valuation:${tenantId}`,
    analytics: (tenantId: string, type: string, period: string) => `analytics:${tenantId}:${type}:${period}`,
    customer: (tenantId: string, customerId: string) => `customer:${tenantId}:${customerId}`,
    vehicle: (tenantId: string, vehicleId: string) => `vehicle:${tenantId}:${vehicleId}`,
    booking: (tenantId: string, bookingId: string) => `booking:${tenantId}:${bookingId}`,
    part: (tenantId: string, partId: string) => `part:${tenantId}:${partId}`,
  };

  /**
   * Cache invalidation helpers
   */
  static Invalidation = {
    invalidateTenant: async (tenantId: string): Promise<void> => {
      await CacheUtil.delPattern(`*:${tenantId}:*`);
    },

    invalidateReports: async (tenantId: string): Promise<void> => {
      await CacheUtil.delPattern(`report:${tenantId}:*`);
    },

    invalidateInventory: async (tenantId: string): Promise<void> => {
      await CacheUtil.delPattern(`inventory:${tenantId}:*`);
      await CacheUtil.delPattern(`part:${tenantId}:*`);
    },

    invalidateAnalytics: async (tenantId: string): Promise<void> => {
      await CacheUtil.delPattern(`analytics:${tenantId}:*`);
    },

    invalidateCustomer: async (tenantId: string, customerId: string): Promise<void> => {
      await CacheUtil.del(CacheUtil.Keys.customer(tenantId, customerId));
    },

    invalidateVehicle: async (tenantId: string, vehicleId: string): Promise<void> => {
      await CacheUtil.del(CacheUtil.Keys.vehicle(tenantId, vehicleId));
    },

    invalidateBooking: async (tenantId: string, bookingId: string): Promise<void> => {
      await CacheUtil.del(CacheUtil.Keys.booking(tenantId, bookingId));
    },
  };
}

/**
 * Cache decorator for memoizing function results
 */
export function Cached(keyPrefix: string, ttl: number = 300) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = `${keyPrefix}:${JSON.stringify(args)}`;
      const cached = await CacheUtil.get(key);
      if (cached !== null) {
        return cached;
      }

      const result = await originalMethod.apply(this, args);
      await CacheUtil.set(key, result, { ttl });
      return result;
    };

    return descriptor;
  };
}
