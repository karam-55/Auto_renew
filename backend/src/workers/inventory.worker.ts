import { Worker, Job } from 'bullmq';
import { QueueConfig, QueueNames, JobTypes } from '../queues/queue.config';
import { LoggingMiddleware } from '../api/middlewares/logging.middleware';
import prisma from '../config/database';

/**
 * Inventory Worker
 * Handles inventory tasks like stock updates, purchase orders, and GRN processing
 */
export class InventoryWorker {
  private static worker: Worker;

  /**
   * Initialize the inventory worker
   */
  static async initialize(): Promise<void> {
    InventoryWorker.worker = QueueConfig.createWorker(
      QueueNames.INVENTORY,
      InventoryWorker.processor.bind(InventoryWorker)
    );

    InventoryWorker.setupEventListeners();
    await InventoryWorker.worker.waitUntilReady();
    LoggingMiddleware.logCacheEvent('WORKER_STARTED', QueueNames.INVENTORY);
  }

  /**
   * Job processor
   */
  private static async processor(job: Job): Promise<any> {
    const { type, data } = job.data;

    switch (type) {
      case JobTypes.UPDATE_STOCK_LEVELS:
        return InventoryWorker.updateStockLevels(data);
      case JobTypes.GENERATE_PURCHASE_ORDER:
        return InventoryWorker.generatePurchaseOrder(data);
      case JobTypes.PROCESS_GRN:
        return InventoryWorker.processGRN(data);
      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  }

  /**
   * Update stock levels
   */
  private static async updateStockLevels(data: any): Promise<any> {
    LoggingMiddleware.logCacheEvent('STOCK_LEVELS_UPDATE', 'job', {
      tenantId: data.tenantId,
      partId: data.partId,
    });

    const updatedPart = await prisma.part.update({
      where: { id: data.partId, tenantId: data.tenantId },
      data: { quantity: data.newLevel },
    });

    return { success: true, partId: data.partId, newLevel: updatedPart.quantity };
  }

  /**
   * Generate purchase order
   */
  private static async generatePurchaseOrder(data: any): Promise<any> {
    LoggingMiddleware.logCacheEvent('PURCHASE_ORDER_GENERATE', 'job', {
      tenantId: data.tenantId,
      supplierId: data.supplierId,
    });

    // Get low stock items that need reordering
    const allParts = await prisma.part.findMany({
      where: { tenantId: data.tenantId },
    });
    const lowStockParts = allParts.filter((p: any) => Number(p.quantity) < Number(p.reorderPoint));

    if (lowStockParts.length === 0) {
      return { success: true, purchaseOrderId: null, message: 'No parts need reordering' };
    }

    const totalCost = lowStockParts.reduce((sum: number, part: any) => {
      const qty = Math.max(1, Number(part.reorderPoint) * 2 - Number(part.quantity));
      return sum + (Number(part.costSYP || 0) * qty);
    }, 0);

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        tenantId: data.tenantId,
        supplierId: data.supplierId,
        orderNumber: `PO-${Date.now()}`,
        status: 'PENDING' as any,
        totalSYP: totalCost,
        items: {
          create: lowStockParts.map((part: any) => {
            const qty = Math.max(1, Number(part.reorderPoint) * 2 - Number(part.quantity));
            const cost = Number(part.costSYP || 0);
            return {
              tenantId: data.tenantId,
              partId: part.id,
              quantity: qty,
              costSYP: cost,
              costUSD: part.costUSD ? Number(part.costUSD) : null,
              totalSYP: cost * qty,
              totalUSD: part.costUSD ? Number(part.costUSD) * qty : null,
            };
          }),
        },
      },
    });

    return { success: true, purchaseOrderId: purchaseOrder.id, items: lowStockParts.length };
  }

  /**
   * Process GRN
   */
  private static async processGRN(data: any): Promise<any> {
    LoggingMiddleware.logCacheEvent('GRN_PROCESS', 'job', {
      grnId: data.grnId,
      tenantId: data.tenantId,
    });

    const grn = await prisma.goodsReceiptNote.findFirst({
      where: { id: data.grnId, tenantId: data.tenantId },
      include: { lines: true },
    });

    if (!grn) {
      throw new Error(`GRN ${data.grnId} not found`);
    }

    // Update stock levels for each GRN item
    for (const line of (grn as any).lines) {
      await prisma.part.update({
        where: { id: line.partId },
        data: {
          quantity: { increment: line.receivedQuantity },
          costSYP: line.unitCost,
        },
      });
    }

    // Update GRN status
    await prisma.goodsReceiptNote.update({
      where: { id: data.grnId },
      data: { status: 'PROCESSED' as any },
    });

    return { success: true, grnId: data.grnId, processed: true, itemsUpdated: (grn as any).lines.length };
  }

  /**
   * Setup event listeners for queue events
   */
  private static setupEventListeners(): void {
    InventoryWorker.worker.on('completed', (job: Job) => {
      LoggingMiddleware.logCacheEvent('JOB_COMPLETED', QueueNames.INVENTORY, {
        jobId: job.id,
        type: job.data.type,
        duration: job.processedOn ? Date.now() - job.processedOn : 0,
      });
    });

    InventoryWorker.worker.on('failed', (job: Job | undefined, error: Error) => {
      LoggingMiddleware.logCacheEvent('JOB_FAILED', QueueNames.INVENTORY, {
        jobId: job?.id,
        type: job?.data?.type,
        attempts: job?.attemptsMade,
        error: error.message,
      });
    });

    InventoryWorker.worker.on('progress', (job: Job, progress: any) => {
      LoggingMiddleware.logCacheEvent('JOB_PROGRESS', QueueNames.INVENTORY, {
        jobId: job.id,
        progress,
      });
    });

    InventoryWorker.worker.on('stalled', (jobId: string) => {
      LoggingMiddleware.logCacheEvent('JOB_STALLED', QueueNames.INVENTORY, {
        jobId,
      });
    });
  }

  /**
   * Close the worker
   */
  static async close(): Promise<void> {
    if (InventoryWorker.worker) {
      await InventoryWorker.worker.close();
      LoggingMiddleware.logCacheEvent('WORKER_STOPPED', QueueNames.INVENTORY);
    }
  }
}
