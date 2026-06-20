import { Queue } from 'bullmq';
import { QueueConfig, QueueNames, JobTypes } from './queue.config';
import { LoggingMiddleware } from '../api/middlewares/logging.middleware';

/**
 * Queue Service
 * Provides methods to add jobs to various queues
 */
export class QueueService {
  private static queues: Map<string, Queue> = new Map();

  /**
   * Get or create a queue
   */
  private static getQueue(queueName: string): Queue {
    if (!this.queues.has(queueName)) {
      const queue = QueueConfig.createQueue(queueName);
      this.queues.set(queueName, queue);
      
      // Setup queue event listeners
      this.setupQueueListeners(queue, queueName);
    }
    return this.queues.get(queueName)!;
  }

  /**
   * Setup queue event listeners
   * Note: Worker events (started, completed, failed, stalled) are handled in individual workers
   */
  private static setupQueueListeners(queue: Queue, queueName: string): void {
    // Queue-level events only
    queue.on('error', (error: Error) => {
      LoggingMiddleware.logCacheEvent('QUEUE_ERROR', queueName, { error: error.message });
    });
  }

  /**
   * Add notification job
   */
  static async addNotificationJob(type: string, data: any, options?: any): Promise<any> {
    const queue = this.getQueue(QueueNames.NOTIFICATIONS);
    const job = await queue.add(
      type,
      { type, data },
      {
        ...options,
        jobId: crypto.randomUUID(),
      }
    );
    LoggingMiddleware.logCacheEvent('JOB_ADDED', QueueNames.NOTIFICATIONS, { 
      jobId: job.id, 
      type,
    });
    return job;
  }

  /**
   * Add PDF job
   */
  static async addPdfJob(type: string, data: any, options?: any): Promise<any> {
    const queue = this.getQueue(QueueNames.PDF);
    const job = await queue.add(
      type,
      { type, data },
      {
        ...options,
        jobId: crypto.randomUUID(),
      }
    );
    LoggingMiddleware.logCacheEvent('JOB_ADDED', QueueNames.PDF, { 
      jobId: job.id, 
      type,
    });
    return job;
  }

  /**
   * Add reports job
   */
  static async addReportsJob(type: string, data: any, options?: any): Promise<any> {
    const queue = this.getQueue(QueueNames.REPORTS);
    const job = await queue.add(
      type,
      { type, data },
      {
        ...options,
        jobId: crypto.randomUUID(),
      }
    );
    LoggingMiddleware.logCacheEvent('JOB_ADDED', QueueNames.REPORTS, { 
      jobId: job.id, 
      type,
    });
    return job;
  }

  /**
   * Add accounting job
   */
  static async addAccountingJob(type: string, data: any, options?: any): Promise<any> {
    const queue = this.getQueue(QueueNames.ACCOUNTING);
    const job = await queue.add(
      type,
      { type, data },
      {
        ...options,
        jobId: crypto.randomUUID(),
      }
    );
    LoggingMiddleware.logCacheEvent('JOB_ADDED', QueueNames.ACCOUNTING, { 
      jobId: job.id, 
      type,
    });
    return job;
  }

  /**
   * Add inventory job
   */
  static async addInventoryJob(type: string, data: any, options?: any): Promise<any> {
    const queue = this.getQueue(QueueNames.INVENTORY);
    const job = await queue.add(
      type,
      { type, data },
      {
        ...options,
        jobId: crypto.randomUUID(),
      }
    );
    LoggingMiddleware.logCacheEvent('JOB_ADDED', QueueNames.INVENTORY, { 
      jobId: job.id, 
      type,
    });
    return job;
  }

  /**
   * Get queue stats
   */
  static async getQueueStats(queueName: string): Promise<any> {
    const queue = this.getQueue(queueName);
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }

  /**
   * Get all queue stats
   */
  static async getAllQueueStats(): Promise<any[]> {
    const stats = await Promise.all([
      this.getQueueStats(QueueNames.NOTIFICATIONS),
      this.getQueueStats(QueueNames.PDF),
      this.getQueueStats(QueueNames.REPORTS),
      this.getQueueStats(QueueNames.ACCOUNTING),
      this.getQueueStats(QueueNames.INVENTORY),
    ]);
    return stats;
  }

  /**
   * Close all queues
   */
  static async closeAll(): Promise<void> {
    const closePromises = Array.from(this.queues.values()).map(queue => queue.close());
    await Promise.all(closePromises);
    this.queues.clear();
  }
}
