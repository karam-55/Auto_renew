import Redis from 'ioredis';
import { Logger } from '../../infrastructure/logging/logger';

/**
 * Redis Cache Service
 * Handles caching for heavy endpoints with TTL support
 */
export class CacheService {
  private static client: Redis | null = null;
  private static isConnected = false;

  /**
   * Initialize Redis connection
   */
  static async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      this.client.on('connect', () => {
        Logger.info('Redis connected');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        Logger.error('Redis error', err);
        this.isConnected = false;
      });

      // Test connection
      await this.client.ping();
    } catch (error) {
      Logger.error('Failed to connect to Redis', error);
      this.isConnected = false;
    }
  }

  /**
   * Get cached value
   */
  static async get(key: string): Promise<any | null> {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value);
    } catch (error) {
      Logger.error('Cache get error', error);
      return null;
    }
  }

  /**
   * Set cached value with TTL
   */
  static async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      await this.client.setex(key, ttlSeconds, serialized);
    } catch (error) {
      Logger.error('Cache set error', error);
    }
  }

  /**
   * Delete cached value
   */
  static async delete(key: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      Logger.error('Cache delete error', error);
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  static async deletePattern(pattern: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      Logger.error('Cache delete pattern error', error);
    }
  }

  /**
   * Check if key exists
   */
  static async exists(key: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      Logger.error('Cache exists error', error);
      return false;
    }
  }

  /**
   * Clear all cache (use with caution)
   */
  static async flushAll(): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      await this.client.flushall();
    } catch (error) {
      Logger.error('Cache flush error', error);
    }
  }

  /**
   * Cache invalidation rules
   */
  static async invalidateOnInvoiceCreation(tenantId: string): Promise<void> {
    // Invalidate dashboard cache
    await this.deletePattern(`dashboard:${tenantId}:*`);
    // Invalidate reports cache
    await this.deletePattern(`reports:${tenantId}:*`);
    // Invalidate profit per booking cache
    await this.deletePattern(`profit:${tenantId}:*`);
  }

  static async invalidateOnGRNFinalization(tenantId: string): Promise<void> {
    // Invalidate inventory valuation cache
    await this.deletePattern(`inventory:${tenantId}:*`);
    // Invalidate dashboard cache
    await this.deletePattern(`dashboard:${tenantId}:*`);
  }

  static async invalidateOnPaymentCreation(tenantId: string): Promise<void> {
    // Invalidate dashboard cache
    await this.deletePattern(`dashboard:${tenantId}:*`);
    // Invalidate reports cache
    await this.deletePattern(`reports:${tenantId}:*`);
    // Invalidate customer balance cache
    await this.deletePattern(`balance:${tenantId}:*`);
  }

  /**
   * Generate cache key
   */
  static generateKey(prefix: string, tenantId: string, identifier: string = ''): string {
    return `${prefix}:${tenantId}${identifier ? `:${identifier}` : ''}`;
  }

  /**
   * Get or set pattern (cache-aside)
   */
  static async getOrSet(
    key: string,
    ttlSeconds: number,
    fetchFn: () => Promise<any>
  ): Promise<any> {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  /**
   * Disconnect Redis
   */
  static async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}
