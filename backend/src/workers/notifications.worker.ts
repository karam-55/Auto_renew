import { Worker, Job } from 'bullmq';
import { QueueConfig, QueueNames, JobTypes } from '../queues/queue.config';
import { LoggingMiddleware } from '../api/middlewares/logging.middleware';
import { WhatsAppService } from '../modules/whatsapp/service';

/**
 * Notifications Worker
 * Handles WhatsApp notifications only
 */
export class NotificationsWorker {
  private static worker: Worker;

  /**
   * Initialize the notifications worker
   */
  static async initialize(): Promise<void> {
    NotificationsWorker.worker = QueueConfig.createWorker(
      QueueNames.NOTIFICATIONS,
      NotificationsWorker.processor.bind(NotificationsWorker)
    );

    NotificationsWorker.setupEventListeners();
    await NotificationsWorker.worker.waitUntilReady();
    LoggingMiddleware.logCacheEvent('WORKER_STARTED', QueueNames.NOTIFICATIONS);
  }

  /**
   * Job processor
   */
  private static async processor(job: Job): Promise<any> {
    const { type, data } = job.data;

    switch (type) {
      case JobTypes.SEND_WHATSAPP:
        return NotificationsWorker.sendWhatsApp(data);
      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  }

  /**
   * Send WhatsApp message
   */
  private static async sendWhatsApp(data: any): Promise<any> {
    LoggingMiddleware.logCacheEvent('WHATSAPP_SEND', 'job', { phone: data.phone });

    const whatsappService = new WhatsAppService();
    const result = await whatsappService.sendMessage({
      to: data.phone,
      message: data.message,
    });

    if (!result.success) {
      throw new Error(result.error || 'WhatsApp message failed to send');
    }

    return { success: true, messageId: result.messageId || crypto.randomUUID() };
  }

  /**
   * Setup event listeners for queue events
   */
  private static setupEventListeners(): void {
    NotificationsWorker.worker.on('completed', (job: Job) => {
      LoggingMiddleware.logCacheEvent('JOB_COMPLETED', QueueNames.NOTIFICATIONS, {
        jobId: job.id,
        type: job.data.type,
        duration: job.processedOn ? Date.now() - job.processedOn : 0,
      });
    });

    NotificationsWorker.worker.on('failed', (job: Job | undefined, error: Error) => {
      LoggingMiddleware.logCacheEvent('JOB_FAILED', QueueNames.NOTIFICATIONS, {
        jobId: job?.id,
        type: job?.data?.type,
        attempts: job?.attemptsMade,
        error: error.message,
      });
    });

    NotificationsWorker.worker.on('progress', (job: Job, progress: any) => {
      LoggingMiddleware.logCacheEvent('JOB_PROGRESS', QueueNames.NOTIFICATIONS, {
        jobId: job.id,
        progress,
      });
    });

    NotificationsWorker.worker.on('stalled', (jobId: string) => {
      LoggingMiddleware.logCacheEvent('JOB_STALLED', QueueNames.NOTIFICATIONS, {
        jobId,
      });
    });
  }

  /**
   * Close the worker
   */
  static async close(): Promise<void> {
    if (NotificationsWorker.worker) {
      await NotificationsWorker.worker.close();
      LoggingMiddleware.logCacheEvent('WORKER_STOPPED', QueueNames.NOTIFICATIONS);
    }
  }
}
