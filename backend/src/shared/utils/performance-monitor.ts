import { Request, Response } from 'express';
import { Logger } from '../../infrastructure/logging/logger';
import { getQueryStats } from './query-optimizer';

/**
 * Performance Monitor
 * Provides endpoints and utilities for monitoring application performance.
 */

interface PerformanceMetrics {
  memory: {
    used: number;
    total: number;
    external: number;
    rss: number;
  };
  uptime: number;
  queryStats: ReturnType<typeof getQueryStats>;
  cpu: NodeJS.CpuUsage;
  timestamp: string;
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  const memUsage = process.memoryUsage();

  return {
    memory: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
    },
    uptime: Math.round(process.uptime()),
    queryStats: getQueryStats(),
    cpu: process.cpuUsage(),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Express middleware to track request timing
 */
export function performanceMiddleware(req: Request, res: Response, next: () => void): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const memoryUsed = process.memoryUsage().heapUsed / 1024 / 1024;

    if (duration > 1000 || memoryUsed > 512) {
      Logger.warn('Performance alert', {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
        memoryUsed: `${Math.round(memoryUsed)}MB`,
        statusCode: res.statusCode,
      });
    }
  });

  next();
}

/**
 * Health check endpoint handler
 */
export function healthCheckHandler(req: Request, res: Response): void {
  const metrics = getPerformanceMetrics();

  const isHealthy =
    metrics.memory.used < 1024 && // Less than 1GB heap used
    metrics.queryStats.verySlowQueries < 10; // Less than 10 very slow queries

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    ...metrics,
  });
}

/**
 * Performance stats endpoint (admin only)
 */
export function performanceStatsHandler(req: Request, res: Response): void {
  const metrics = getPerformanceMetrics();

  res.status(200).json({
    success: true,
    data: metrics,
    timestamp: new Date().toISOString(),
  });
}
