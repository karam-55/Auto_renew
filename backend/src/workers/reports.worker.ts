import { Worker, Job } from 'bullmq';
import { QueueConfig, QueueNames, JobTypes } from '../queues/queue.config';
import { LoggingMiddleware } from '../api/middlewares/logging.middleware';
import prisma from '../config/database';

/**
 * Reports Worker
 * Handles heavy report generation tasks
 */
export class ReportsWorker {
  private static worker: Worker;

  /**
   * Initialize the reports worker
   */
  static async initialize(): Promise<void> {
    ReportsWorker.worker = QueueConfig.createWorker(
      QueueNames.REPORTS,
      ReportsWorker.processor.bind(ReportsWorker)
    );

    ReportsWorker.setupEventListeners();
    await ReportsWorker.worker.waitUntilReady();
    LoggingMiddleware.logCacheEvent('WORKER_STARTED', QueueNames.REPORTS);
  }

  /**
   * Job processor
   */
  private static async processor(job: Job): Promise<any> {
    const { type, data } = job.data;

    switch (type) {
      case JobTypes.GENERATE_DASHBOARD_REPORT:
        return ReportsWorker.generateDashboardReport(data);
      case JobTypes.GENERATE_SALES_REPORT:
        return ReportsWorker.generateSalesReport(data);
      case JobTypes.GENERATE_INVENTORY_REPORT:
        return ReportsWorker.generateInventoryReport(data);
      case JobTypes.GENERATE_PROFIT_REPORT:
        return ReportsWorker.generateProfitReport(data);
      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  }

  /**
   * Generate dashboard report
   */
  private static async generateDashboardReport(data: any): Promise<any> {
    LoggingMiddleware.logCacheEvent('DASHBOARD_REPORT_GENERATE', 'job', { tenantId: data.tenantId });

    const [totalRevenue, totalBookings, totalCustomers, totalInvoices] = await Promise.all([
      prisma.invoice.aggregate({
        where: { tenantId: data.tenantId },
        _sum: { totalSYP: true },
      }),
      prisma.booking.count({ where: { tenantId: data.tenantId } }),
      prisma.customer.count({ where: { tenantId: data.tenantId } }),
      prisma.invoice.count({ where: { tenantId: data.tenantId } }),
    ]);

    return { success: true, reportId: crypto.randomUUID(), data: {
      totalRevenue: totalRevenue._sum.totalSYP || 0,
      totalBookings,
      totalCustomers,
      totalInvoices,
    }};
  }

  /**
   * Generate sales report
   */
  private static async generateSalesReport(data: any): Promise<any> {
    LoggingMiddleware.logCacheEvent('SALES_REPORT_GENERATE', 'job', {
      tenantId: data.tenantId,
      startDate: data.startDate,
      endDate: data.endDate,
    });

    const where: any = { tenantId: data.tenantId };
    if (data.startDate || data.endDate) {
      where.createdAt = {};
      if (data.startDate) where.createdAt.gte = new Date(data.startDate);
      if (data.endDate) where.createdAt.lte = new Date(data.endDate);
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: { items: true, customer: true },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, reportId: crypto.randomUUID(), data: invoices };
  }

  /**
   * Generate inventory report
   */
  private static async generateInventoryReport(data: any): Promise<any> {
    LoggingMiddleware.logCacheEvent('INVENTORY_REPORT_GENERATE', 'job', { tenantId: data.tenantId });

    const parts = await prisma.part.findMany({
      where: { tenantId: data.tenantId },
      include: { category: true },
      orderBy: { name: 'asc' },
    });

    const reportData = parts.map((part: any) => ({
      id: part.id,
      name: part.name,
      partNumber: part.partNumber,
      quantity: part.quantity,
      costSYP: part.costSYP,
      inventoryValue: Number(part.quantity) * Number(part.costSYP),
      reorderPoint: part.reorderPoint,
      status: Number(part.quantity) < Number(part.reorderPoint) ? 'LOW_STOCK' : 'OK',
    }));

    return { success: true, reportId: crypto.randomUUID(), data: reportData };
  }

  /**
   * Generate profit report
   */
  private static async generateProfitReport(data: any): Promise<any> {
    LoggingMiddleware.logCacheEvent('PROFIT_REPORT_GENERATE', 'job', {
      tenantId: data.tenantId,
      startDate: data.startDate,
      endDate: data.endDate,
    });

    const where: any = { tenantId: data.tenantId };
    if (data.startDate || data.endDate) {
      where.createdAt = {};
      if (data.startDate) where.createdAt.gte = new Date(data.startDate);
      if (data.endDate) where.createdAt.lte = new Date(data.endDate);
    }

    const [invoices, expenses] = await Promise.all([
      prisma.invoice.findMany({ where, include: { items: true } }),
      prisma.expense.findMany({ where }),
    ]);

    const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + Number(inv.totalSYP || 0), 0);
    const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + Number(exp.amountSYP || 0), 0);
    // Note: This is a simplified summary (Revenue - Expenses = Net), not formal P&L
    // Formal P&L with COGS separation uses /api/reports/profit-loss
    const netProfit = totalRevenue - totalExpenses;

    return { success: true, reportId: crypto.randomUUID(), data: {
      totalRevenue,
      totalExpenses,
      grossProfit: netProfit, // Simplified — see formal P&L endpoint for COGS breakdown
      profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
      invoiceCount: invoices.length,
      expenseCount: expenses.length,
    }};
  }

  /**
   * Setup event listeners for queue events
   */
  private static setupEventListeners(): void {
    ReportsWorker.worker.on('completed', (job: Job) => {
      LoggingMiddleware.logCacheEvent('JOB_COMPLETED', QueueNames.REPORTS, {
        jobId: job.id,
        type: job.data.type,
        duration: job.processedOn ? Date.now() - job.processedOn : 0,
      });
    });

    ReportsWorker.worker.on('failed', (job: Job | undefined, error: Error) => {
      LoggingMiddleware.logCacheEvent('JOB_FAILED', QueueNames.REPORTS, {
        jobId: job?.id,
        type: job?.data?.type,
        attempts: job?.attemptsMade,
        error: error.message,
      });
    });

    ReportsWorker.worker.on('progress', (job: Job, progress: any) => {
      LoggingMiddleware.logCacheEvent('JOB_PROGRESS', QueueNames.REPORTS, {
        jobId: job.id,
        progress,
      });
    });

    ReportsWorker.worker.on('stalled', (jobId: string) => {
      LoggingMiddleware.logCacheEvent('JOB_STALLED', QueueNames.REPORTS, {
        jobId,
      });
    });
  }

  /**
   * Close the worker
   */
  static async close(): Promise<void> {
    if (ReportsWorker.worker) {
      await ReportsWorker.worker.close();
      LoggingMiddleware.logCacheEvent('WORKER_STOPPED', QueueNames.REPORTS);
    }
  }
}
