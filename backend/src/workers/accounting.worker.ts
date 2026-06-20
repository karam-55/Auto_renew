import { Worker, Job } from 'bullmq';
import { QueueConfig, QueueNames, JobTypes } from '../queues/queue.config';
import { LoggingMiddleware } from '../api/middlewares/logging.middleware';
import prisma from '../config/database';

/**
 * Accounting Worker
 * Handles accounting tasks like journal entries, reconciliation, and tax calculation
 */
export class AccountingWorker {
  private static worker: Worker;

  /**
   * Initialize the accounting worker
   */
  static async initialize(): Promise<void> {
    AccountingWorker.worker = QueueConfig.createWorker(
      QueueNames.ACCOUNTING,
      AccountingWorker.processor.bind(AccountingWorker)
    );

    AccountingWorker.setupEventListeners();
    await AccountingWorker.worker.waitUntilReady();
    LoggingMiddleware.logCacheEvent('WORKER_STARTED', QueueNames.ACCOUNTING);
  }

  /**
   * Job processor
   */
  private static async processor(job: Job): Promise<any> {
    const { type, data } = job.data;

    switch (type) {
      case JobTypes.PROCESS_JOURNAL_ENTRY:
        return AccountingWorker.processJournalEntry(data);
      case JobTypes.RECONCILE_ACCOUNT:
        return AccountingWorker.reconcileAccount(data);
      case JobTypes.CALCULATE_TAX:
        return AccountingWorker.calculateTax(data);
      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  }

  /**
   * Process journal entry
   */
  private static async processJournalEntry(data: any): Promise<any> {
    LoggingMiddleware.logCacheEvent('JOURNAL_ENTRY_PROCESS', 'job', {
      entryId: data.entryId,
      tenantId: data.tenantId,
    });

    const entry = await prisma.journalEntry.findUnique({
      where: { id: data.entryId },
      include: { lines: true },
    });

    if (!entry) {
      throw new Error(`Journal entry ${data.entryId} not found`);
    }

    // Verify entry balances
    const totalDebit = entry.lines.reduce((sum: number, line: any) => sum + Number(line.debitSYP || 0), 0);
    const totalCredit = entry.lines.reduce((sum: number, line: any) => sum + Number(line.creditSYP || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Journal entry ${data.entryId} is not balanced`);
    }

    return { success: true, entryId: data.entryId, balanced: true, totalDebit, totalCredit };
  }

  /**
   * Reconcile account
   */
  private static async reconcileAccount(data: any): Promise<any> {
    LoggingMiddleware.logCacheEvent('ACCOUNT_RECONCILE', 'job', {
      accountId: data.accountId,
      tenantId: data.tenantId,
    });

    const account = await prisma.account.findFirst({
      where: { id: data.accountId, tenantId: data.tenantId },
    });

    if (!account) {
      throw new Error(`Account ${data.accountId} not found`);
    }

    // Get journal lines for this account
    const lines = await prisma.journalLine.findMany({
      where: { accountId: data.accountId, entry: { tenantId: data.tenantId } },
    });

    const calculatedBalance = lines.reduce((sum: number, line: any) => {
      const debit = Number(line.debitSYP || 0);
      const credit = Number(line.creditSYP || 0);
      // Debit increases balance for ASSET, COGS, EXPENSE
      // Credit increases balance for LIABILITY, EQUITY, REVENUE
      if (account.accountType === 'ASSET' || account.accountType === 'COGS' || account.accountType === 'EXPENSE') {
        return sum + debit - credit;
      } else {
        return sum + credit - debit;
      }
    }, 0);

    const storedBalance = Number(account.balanceSYP || 0);
    const reconciled = Math.abs(calculatedBalance - storedBalance) < 0.01;

    if (!reconciled) {
      await prisma.account.update({
        where: { id: data.accountId },
        data: { balanceSYP: calculatedBalance },
      });
    }

    return { success: true, accountId: data.accountId, reconciled, calculatedBalance, storedBalance };
  }

  /**
   * Calculate tax
   */
  private static async calculateTax(data: any): Promise<any> {
    LoggingMiddleware.logCacheEvent('TAX_CALCULATE', 'job', {
      invoiceId: data.invoiceId,
      tenantId: data.tenantId,
    });

    const invoice = await prisma.invoice.findFirst({
      where: { id: data.invoiceId, tenantId: data.tenantId },
      include: { items: true },
    });

    if (!invoice) {
      throw new Error(`Invoice ${data.invoiceId} not found`);
    }

    const subtotal = Number(invoice.subtotalSYP || 0);
    const taxRate = data.taxRate || 0;
    const taxAmount = Math.round(subtotal * (taxRate / 100));

    // Update invoice tax
    await prisma.invoice.update({
      where: { id: data.invoiceId },
      data: {
        taxSYP: taxAmount,
        totalSYP: subtotal + taxAmount - Number(invoice.discountSYP || 0),
      },
    });

    return { success: true, invoiceId: data.invoiceId, taxAmount, total: subtotal + taxAmount };
  }

  /**
   * Setup event listeners for queue events
   */
  private static setupEventListeners(): void {
    AccountingWorker.worker.on('completed', (job: Job) => {
      LoggingMiddleware.logCacheEvent('JOB_COMPLETED', QueueNames.ACCOUNTING, {
        jobId: job.id,
        type: job.data.type,
        duration: job.processedOn ? Date.now() - job.processedOn : 0,
      });
    });

    AccountingWorker.worker.on('failed', (job: Job | undefined, error: Error) => {
      LoggingMiddleware.logCacheEvent('JOB_FAILED', QueueNames.ACCOUNTING, {
        jobId: job?.id,
        type: job?.data?.type,
        attempts: job?.attemptsMade,
        error: error.message,
      });
    });

    AccountingWorker.worker.on('progress', (job: Job, progress: any) => {
      LoggingMiddleware.logCacheEvent('JOB_PROGRESS', QueueNames.ACCOUNTING, {
        jobId: job.id,
        progress,
      });
    });

    AccountingWorker.worker.on('stalled', (jobId: string) => {
      LoggingMiddleware.logCacheEvent('JOB_STALLED', QueueNames.ACCOUNTING, {
        jobId,
      });
    });
  }

  /**
   * Close the worker
   */
  static async close(): Promise<void> {
    if (AccountingWorker.worker) {
      await AccountingWorker.worker.close();
      LoggingMiddleware.logCacheEvent('WORKER_STOPPED', QueueNames.ACCOUNTING);
    }
  }
}
