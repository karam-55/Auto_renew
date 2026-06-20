import { Request, Response } from 'express';
import prisma from '../../config/database';

export class HealthController {
  /**
   * Liveness probe - checks if the application is running
   * GET /health/live
   */
  async live(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Readiness probe - checks if the application is ready to accept traffic
   * GET /health/ready
   */
  async ready(req: Request, res: Response): Promise<void> {
    const checks = {
      database: false,
      redis: false,
      queue: false,
    };

    let allHealthy = true;

    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (error) {
      allHealthy = false;
    }

    // Check Redis connection (if configured)
    const redisClient = (global as any).redisClient;
    if (redisClient) {
      try {
        await redisClient.ping();
        checks.redis = true;
      } catch (error) {
        allHealthy = false;
      }
    } else {
      checks.redis = true; // Redis is optional
    }

    // Check queue status (if configured)
    const queue = (global as any).queue;
    if (queue) {
      try {
        checks.queue = queue.isReady ? queue.isReady() : true;
        if (!checks.queue) allHealthy = false;
      } catch (error) {
        allHealthy = false;
      }
    } else {
      checks.queue = true; // Queue is optional
    }

    const statusCode = allHealthy ? 200 : 503;
    res.status(statusCode).json({
      status: allHealthy ? 'ready' : 'not ready',
      timestamp: new Date().toISOString(),
      checks,
    });
  }

  /**
   * Detailed health check with system information
   * GET /health
   */
  async detailed(req: Request, res: Response): Promise<void> {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0',
      checks: {
        database: await this.checkDatabase(),
        redis: await this.checkRedis(),
        queue: await this.checkQueue(),
        minio: await this.checkMinIO(),
      },
    };

    const allHealthy = Object.values(health.checks).every(check => check.healthy);
    const statusCode = allHealthy ? 200 : 503;
    health.status = allHealthy ? 'ok' : 'degraded';

    res.status(statusCode).json(health);
  }

  private async checkDatabase(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { healthy: true, latency: Date.now() - start };
    } catch (error: any) {
      return { healthy: false, error: error.message };
    }
  }

  private async checkRedis(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    const redisClient = (global as any).redisClient;
    if (!redisClient) {
      return { healthy: true, error: 'Redis not configured' };
    }

    const start = Date.now();
    try {
      await redisClient.ping();
      return { healthy: true, latency: Date.now() - start };
    } catch (error: any) {
      return { healthy: false, error: error.message };
    }
  }

  private async checkQueue(): Promise<{ healthy: boolean; error?: string }> {
    const queue = (global as any).queue;
    if (!queue) {
      return { healthy: true, error: 'Queue not configured' };
    }

    try {
      // Check if queue is ready (implementation depends on queue library)
      const isReady = queue.isReady ? await queue.isReady() : true;
      return { healthy: isReady };
    } catch (error: any) {
      return { healthy: false, error: error.message };
    }
  }

  private async checkMinIO(): Promise<{ healthy: boolean; error?: string }> {
    const minioClient = (global as any).minioClient;
    if (!minioClient) {
      return { healthy: true, error: 'MinIO not configured' };
    }

    try {
      // Check MinIO connection
      await minioClient.listBuckets();
      return { healthy: true };
    } catch (error: any) {
      return { healthy: false, error: error.message };
    }
  }
}
