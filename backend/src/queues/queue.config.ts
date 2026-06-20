import { Queue, Worker, QueueOptions, WorkerOptions } from 'bullmq';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

/**
 * Parse Redis URL to connection options
 */
function parseRedisUrl(url: string) {
  const urlObj = new URL(url);
  return {
    host: urlObj.hostname,
    port: parseInt(urlObj.port) || 6379,
    password: urlObj.password || undefined,
    db: parseInt(urlObj.pathname.slice(1)) || 0,
  };
}

/**
 * Queue Configuration
 * Centralized configuration for BullMQ queues and workers
 */
export class QueueConfig {
  private static connectionOptions = parseRedisUrl(redisUrl);

  /**
   * Get default queue options
   */
  static getQueueOptions(queueName: string): QueueOptions {
    return {
      connection: this.connectionOptions,
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: {
          count: 1000, // Keep last 1000 completed jobs
          age: 24 * 3600, // 24 hours
        },
        removeOnFail: {
          count: 5000, // Keep last 5000 failed jobs
          age: 7 * 24 * 3600, // 7 days
        },
      },
    };
  }

  /**
   * Get default worker options
   */
  static getWorkerOptions(queueName: string): WorkerOptions {
    return {
      connection: this.connectionOptions,
      concurrency: 5,
      limiter: {
        max: 100,
        duration: 60000, // 100 jobs per minute
      },
    };
  }

  /**
   * Create a queue
   */
  static createQueue(queueName: string): Queue {
    return new Queue(queueName, this.getQueueOptions(queueName));
  }

  /**
   * Create a worker
   */
  static createWorker(
    queueName: string,
    processor: (job: any) => Promise<any>
  ): Worker {
    return new Worker(queueName, processor, this.getWorkerOptions(queueName));
  }
}

/**
 * Queue Names
 */
export const QueueNames = {
  NOTIFICATIONS: 'notifications',
  PDF: 'pdf',
  REPORTS: 'reports',
  ACCOUNTING: 'accounting',
  INVENTORY: 'inventory',
} as const;

/**
 * Job Types
 */
export const JobTypes = {
  // Notifications - WhatsApp only
  SEND_WHATSAPP: 'send-whatsapp',
  
  // PDF
  GENERATE_INVOICE_PDF: 'generate-invoice-pdf',
  GENERATE_REPORT_PDF: 'generate-report-pdf',
  GENERATE_RECEIPT_PDF: 'generate-receipt-pdf',
  
  // Reports
  GENERATE_DASHBOARD_REPORT: 'generate-dashboard-report',
  GENERATE_SALES_REPORT: 'generate-sales-report',
  GENERATE_INVENTORY_REPORT: 'generate-inventory-report',
  GENERATE_PROFIT_REPORT: 'generate-profit-report',
  
  // Accounting
  PROCESS_JOURNAL_ENTRY: 'process-journal-entry',
  RECONCILE_ACCOUNT: 'reconcile-account',
  CALCULATE_TAX: 'calculate-tax',
  
  // Inventory
  UPDATE_STOCK_LEVELS: 'update-stock-levels',
  GENERATE_PURCHASE_ORDER: 'generate-purchase-order',
  PROCESS_GRN: 'process-grn',
} as const;
