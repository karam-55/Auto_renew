import { PrismaClient } from '@prisma/client';
import { Logger } from '../../infrastructure/logging/logger';

/**
 * Query Optimizer & Performance Monitor
 * Detects and logs slow queries, N+1 patterns, and provides optimization suggestions.
 */

const SLOW_QUERY_THRESHOLD = 500; // ms
const VERY_SLOW_QUERY_THRESHOLD = 2000; // ms

interface QueryMetric {
  model: string;
  action: string;
  duration: number;
  timestamp: Date;
  query?: string;
}

const queryMetrics: QueryMetric[] = [];
const MAX_METRICS_SIZE = 1000;

// Simple in-memory cache for COUNT queries
const countCache = new Map<string, { count: number; expiry: number }>();
const COUNT_CACHE_TTL = 30_000; // 30 seconds

export function attachQueryOptimizer(prisma: PrismaClient): void {
  prisma.$use(async (params, next) => {
    // Skip count queries if cached
    if (params.action === 'count' && params.model) {
      const cacheKey = JSON.stringify({ model: params.model, args: params.args });
      const cached = countCache.get(cacheKey);
      if (cached && cached.expiry > Date.now()) {
        return cached.count;
      }
      const result = await next(params);
      if (typeof result === 'number') {
        countCache.set(cacheKey, { count: result, expiry: Date.now() + COUNT_CACHE_TTL });
      }
      return result;
    }

    const start = Date.now();
    const result = await next(params);
    const duration = Date.now() - start;

    if (duration > SLOW_QUERY_THRESHOLD) {
      const metric: QueryMetric = {
        model: params.model || 'Unknown',
        action: params.action,
        duration,
        timestamp: new Date(),
      };

      // Store metric (limit size)
      queryMetrics.push(metric);
      if (queryMetrics.length > MAX_METRICS_SIZE) {
        queryMetrics.shift();
      }

      if (duration > VERY_SLOW_QUERY_THRESHOLD) {
        Logger.error(`VERY SLOW QUERY: ${params.model}.${params.action} took ${duration}ms`, undefined, {
          model: params.model,
          action: params.action,
          duration,
          args: params.args ? JSON.stringify(params.args).substring(0, 500) : undefined,
        });
      } else {
        Logger.warn(`SLOW QUERY: ${params.model}.${params.action} took ${duration}ms`, {
          model: params.model,
          action: params.action,
          duration,
        });
      }
    }

    return result;
  });
}

/**
 * Get query performance statistics
 */
export function getQueryStats(): {
  totalQueries: number;
  slowQueries: number;
  verySlowQueries: number;
  averageDuration: number;
  topSlowQueries: QueryMetric[];
} {
  const slowQueries = queryMetrics.filter((q) => q.duration > SLOW_QUERY_THRESHOLD);
  const verySlowQueries = queryMetrics.filter((q) => q.duration > VERY_SLOW_QUERY_THRESHOLD);
  const avgDuration =
    queryMetrics.length > 0
      ? queryMetrics.reduce((sum, q) => sum + q.duration, 0) / queryMetrics.length
      : 0;

  const topSlow = [...queryMetrics].sort((a, b) => b.duration - a.duration).slice(0, 10);

  return {
    totalQueries: queryMetrics.length,
    slowQueries: slowQueries.length,
    verySlowQueries: verySlowQueries.length,
    averageDuration: Math.round(avgDuration),
    topSlowQueries: topSlow,
  };
}

/**
 * Clear query metrics
 */
export function clearQueryMetrics(): void {
  queryMetrics.length = 0;
}

/**
 * Detect potential N+1 query patterns
 * Logs warning if the same model is queried multiple times in a short window
 */
const recentQueries = new Map<string, number>();
const N1_WINDOW_MS = 100;
const N1_THRESHOLD = 5;

export function detectNPlusOne(model: string, action: string): boolean {
  const key = `${model}.${action}`;
  const now = Date.now();
  const count = (recentQueries.get(key) || 0) + 1;
  recentQueries.set(key, count);

  // Clear old entries periodically
  if (count === 1) {
    setTimeout(() => recentQueries.delete(key), N1_WINDOW_MS);
  }

  if (count >= N1_THRESHOLD) {
    Logger.warn(`Potential N+1 query detected: ${key} executed ${count} times in ${N1_WINDOW_MS}ms`, {
      model,
      action,
      count,
    });
    return true;
  }
  return false;
}
