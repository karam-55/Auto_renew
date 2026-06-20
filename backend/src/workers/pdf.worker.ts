import { Worker, Job } from 'bullmq';
import { QueueConfig, QueueNames, JobTypes } from '../queues/queue.config';
import { LoggingMiddleware } from '../api/middlewares/logging.middleware';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

/**
 * PDF Worker
 * Handles PDF generation for invoices, reports, and receipts
 */
export class PdfWorker {
  private static worker: Worker;

  /**
   * Initialize the PDF worker
   */
  static async initialize(): Promise<void> {
    PdfWorker.worker = QueueConfig.createWorker(
      QueueNames.PDF,
      PdfWorker.processor.bind(PdfWorker)
    );

    PdfWorker.setupEventListeners();
    await PdfWorker.worker.waitUntilReady();
    LoggingMiddleware.logCacheEvent('WORKER_STARTED', QueueNames.PDF);
  }

  /**
   * Job processor
   */
  private static async processor(job: Job): Promise<any> {
    const { type, data } = job.data;

    switch (type) {
      case JobTypes.GENERATE_INVOICE_PDF:
        return PdfWorker.generateInvoicePdf(data);
      case JobTypes.GENERATE_REPORT_PDF:
        return PdfWorker.generateReportPdf(data);
      case JobTypes.GENERATE_RECEIPT_PDF:
        return PdfWorker.generateReceiptPdf(data);
      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  }

  /**
   * Generate invoice PDF
   */
  private static async generateInvoicePdf(data: any): Promise<any> {
    LoggingMiddleware.logCacheEvent('INVOICE_PDF_GENERATE', 'job', { invoiceId: data.invoiceId });
    const pdfDir = path.join(process.cwd(), 'uploads', 'pdfs', 'invoices');
    fs.mkdirSync(pdfDir, { recursive: true });
    const pdfPath = path.join(pdfDir, `${data.invoiceId}.pdf`);
    const pdfUrl = `/uploads/pdfs/invoices/${data.invoiceId}.pdf`;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      doc.fontSize(20).text('Invoice', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Invoice Number: ${data.invoiceNumber || data.invoiceId}`);
      doc.text(`Customer: ${data.customerName || 'N/A'}`);
      doc.text(`Date: ${data.date || new Date().toISOString().split('T')[0]}`);
      doc.moveDown();

      if (data.items && Array.isArray(data.items)) {
        doc.fontSize(14).text('Items:');
        data.items.forEach((item: any, index: number) => {
          doc.fontSize(10).text(`${index + 1}. ${item.name || item.description || 'Item'} - Qty: ${item.quantity || 1} - Price: ${item.price || 0}`);
        });
      }

      doc.moveDown();
      doc.fontSize(12).text(`Subtotal: ${data.subtotal || 0}`);
      doc.text(`Tax: ${data.tax || 0}`);
      doc.text(`Discount: ${data.discount || 0}`);
      doc.fontSize(14).text(`Total: ${data.total || 0}`, { underline: true });

      doc.end();
      stream.on('finish', () => resolve({ success: true, pdfUrl, pdfPath }));
      stream.on('error', reject);
    });
  }

  /**
   * Generate report PDF
   */
  private static async generateReportPdf(data: any): Promise<any> {
    LoggingMiddleware.logCacheEvent('REPORT_PDF_GENERATE', 'job', { reportId: data.reportId });
    const pdfDir = path.join(process.cwd(), 'uploads', 'pdfs', 'reports');
    fs.mkdirSync(pdfDir, { recursive: true });
    const pdfPath = path.join(pdfDir, `${data.reportId}.pdf`);
    const pdfUrl = `/uploads/pdfs/reports/${data.reportId}.pdf`;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      doc.fontSize(20).text(data.reportTitle || 'Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Report Type: ${data.reportType || 'General'}`);
      doc.text(`Generated: ${new Date().toLocaleString()}`);
      doc.moveDown();

      if (data.summary) {
        doc.fontSize(14).text('Summary:');
        Object.entries(data.summary).forEach(([key, value]) => {
          doc.fontSize(10).text(`${key}: ${value}`);
        });
      }

      if (data.rows && Array.isArray(data.rows)) {
        doc.moveDown();
        doc.fontSize(14).text('Details:');
        data.rows.forEach((row: any, index: number) => {
          const text = Object.entries(row).map(([k, v]) => `${k}: ${v}`).join(' | ');
          doc.fontSize(9).text(`${index + 1}. ${text}`);
        });
      }

      doc.end();
      stream.on('finish', () => resolve({ success: true, pdfUrl, pdfPath }));
      stream.on('error', reject);
    });
  }

  /**
   * Generate receipt PDF
   */
  private static async generateReceiptPdf(data: any): Promise<any> {
    LoggingMiddleware.logCacheEvent('RECEIPT_PDF_GENERATE', 'job', { paymentId: data.paymentId });
    const pdfDir = path.join(process.cwd(), 'uploads', 'pdfs', 'receipts');
    fs.mkdirSync(pdfDir, { recursive: true });
    const pdfPath = path.join(pdfDir, `${data.paymentId}.pdf`);
    const pdfUrl = `/uploads/pdfs/receipts/${data.paymentId}.pdf`;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      doc.fontSize(24).text('Payment Receipt', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Receipt #: ${data.paymentId}`);
      doc.text(`Date: ${data.paymentDate || new Date().toLocaleString()}`);
      doc.text(`Customer: ${data.customerName || 'N/A'}`);
      doc.moveDown();
      doc.fontSize(14).text(`Amount Paid: ${data.amount || 0}`);
      doc.text(`Payment Method: ${data.paymentMethod || 'N/A'}`);
      doc.text(`Invoice Reference: ${data.invoiceNumber || data.invoiceId || 'N/A'}`);
      doc.moveDown();
      doc.fontSize(10).text('Thank you for your business!', { align: 'center' });

      doc.end();
      stream.on('finish', () => resolve({ success: true, pdfUrl, pdfPath }));
      stream.on('error', reject);
    });
  }

  /**
   * Setup event listeners for queue events
   */
  private static setupEventListeners(): void {
    PdfWorker.worker.on('completed', (job: Job) => {
      LoggingMiddleware.logCacheEvent('JOB_COMPLETED', QueueNames.PDF, {
        jobId: job.id,
        type: job.data.type,
        duration: job.processedOn ? Date.now() - job.processedOn : 0,
      });
    });

    PdfWorker.worker.on('failed', (job: Job | undefined, error: Error) => {
      LoggingMiddleware.logCacheEvent('JOB_FAILED', QueueNames.PDF, {
        jobId: job?.id,
        type: job?.data?.type,
        attempts: job?.attemptsMade,
        error: error.message,
      });
    });

    PdfWorker.worker.on('progress', (job: Job, progress: any) => {
      LoggingMiddleware.logCacheEvent('JOB_PROGRESS', QueueNames.PDF, {
        jobId: job.id,
        progress,
      });
    });

    PdfWorker.worker.on('stalled', (jobId: string) => {
      LoggingMiddleware.logCacheEvent('JOB_STALLED', QueueNames.PDF, {
        jobId,
      });
    });
  }

  /**
   * Close the worker
   */
  static async close(): Promise<void> {
    if (PdfWorker.worker) {
      await PdfWorker.worker.close();
      LoggingMiddleware.logCacheEvent('WORKER_STOPPED', QueueNames.PDF);
    }
  }
}
