import { Worker, Job } from 'bullmq';
import { QueueConfig, QueueNames, JobTypes } from '../queues/queue.config';
import { LoggingMiddleware } from '../api/middlewares/logging.middleware';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

/**
 * PDF Worker
 * Handles PDF generation for invoices, reports, and receipts
 * Brand Colors: Primary Red #E31E24, Black #000000, White #FFFFFF
 */
export class PdfWorker {
  private static worker: Worker;
  private static readonly PRIMARY_RED = '#E31E24';
  private static readonly PRIMARY_DARK = '#B91C1C';
  private static readonly BLACK = '#000000';
  private static readonly WHITE = '#FFFFFF';
  private static readonly GRAY = '#666666';
  private static readonly LIGHT_GRAY = '#F5F5F5';
  private static readonly BORDER_GRAY = '#E5E5E5';

  /**
   * Get logo path
   */
  private static getLogoPath(): string | null {
    const logoPath = path.join(process.cwd(), 'assets', 'logo.png');
    if (fs.existsSync(logoPath)) return logoPath;
    return null;
  }

  /**
   * Draw header with logo and branding
   */
  private static drawHeader(doc: any, title: string, subtitle?: string) {
    const logoPath = this.getLogoPath();
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const startX = doc.page.margins.left;
    let currentY = doc.y;

    // Red top bar
    doc.save();
    doc.rect(startX - doc.page.margins.left, currentY - 50, doc.page.width, 6)
      .fill(this.PRIMARY_RED);
    doc.restore();

    // Logo
    if (logoPath) {
      try {
        doc.image(logoPath, startX, currentY - 30, { width: 50, height: 50 });
      } catch (e) {
        // Logo not available, skip
      }
    }

    // Company name and title
    const textX = logoPath ? startX + 60 : startX;
    doc.fontSize(10).fillColor(this.GRAY).text('AUTO RENEW', textX, currentY - 25);
    doc.fontSize(20).fillColor(this.BLACK).text(title, textX, currentY - 10);
    if (subtitle) {
      doc.fontSize(11).fillColor(this.GRAY).text(subtitle, textX, currentY + 15);
    }

    doc.moveDown(3);
  }

  /**
   * Draw footer
   */
  private static drawFooter(doc: any) {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 60;

    doc.save();
    doc.rect(0, footerY, pageWidth, 40)
      .fill(this.LIGHT_GRAY);
    doc.restore();

    doc.fontSize(9).fillColor(this.GRAY)
      .text('شكراً لثقتكم بنا | Thank you for your business', 0, footerY + 15, { align: 'center', width: pageWidth });
    doc.fontSize(8).fillColor(this.GRAY)
      .text('AUTO RENEW - نظام إدارة مرآب السيارات', 0, footerY + 30, { align: 'center', width: pageWidth });
  }

  /**
   * Draw table row helper
   */
  private static drawTableRow(doc: any, cols: string[], widths: number[], y: number, fillColor?: string, textColor?: string) {
    const startX = doc.page.margins.left;
    const rowHeight = 24;
    let x = startX;

    if (fillColor) {
      doc.save();
      doc.rect(startX, y, doc.page.width - doc.page.margins.left - doc.page.margins.right, rowHeight).fill(fillColor);
      doc.restore();
    }

    doc.fontSize(10).fillColor(textColor || this.BLACK);
    cols.forEach((col, i) => {
      const align = i === cols.length - 1 ? 'right' : 'left';
      doc.text(col, x + 5, y + 6, { width: widths[i] - 10, align });
      x += widths[i];
    });

    return y + rowHeight;
  }

  /**
   * Draw separator line
   */
  private static drawLine(doc: any, y: number, color: string = this.BORDER_GRAY) {
    doc.save();
    doc.strokeColor(color).lineWidth(1);
    doc.moveTo(doc.page.margins.left, y)
      .lineTo(doc.page.width - doc.page.margins.right, y)
      .stroke();
    doc.restore();
  }

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
   * @public - can be called directly from services (e.g. payment service)
   */
  public static async generateInvoicePdf(data: any): Promise<any> {
    LoggingMiddleware.logCacheEvent('INVOICE_PDF_GENERATE', 'job', { invoiceId: data.invoiceId });
    const pdfDir = path.join(process.cwd(), 'uploads', 'pdfs', 'invoices');
    fs.mkdirSync(pdfDir, { recursive: true });
    const pdfPath = path.join(pdfDir, `${data.invoiceId}.pdf`);
    const pdfUrl = `/uploads/pdfs/invoices/${data.invoiceId}.pdf`;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      // Header
      this.drawHeader(doc, 'فاتورة', `Invoice ${data.invoiceNumber || data.invoiceId}`);

      // Invoice info box
      const infoY = doc.y;
      doc.save();
      doc.roundedRect(doc.page.margins.left, infoY, doc.page.width - 100, 70, 8).fill(this.LIGHT_GRAY);
      doc.restore();

      doc.fontSize(10).fillColor(this.BLACK);
      doc.text(`رقم الفاتورة: ${data.invoiceNumber || data.invoiceId}`, doc.page.margins.left + 15, infoY + 12);
      doc.text(`العميل: ${data.customerName || 'N/A'}`, doc.page.margins.left + 15, infoY + 32);
      doc.text(`التاريخ: ${data.date || new Date().toISOString().split('T')[0]}`, doc.page.margins.left + 15, infoY + 52);

      // Status badge
      const status = data.status || 'ISSUED';
      const statusColor = status === 'PAID' ? '#059669' : status === 'OVERDUE' ? '#DC2626' : this.PRIMARY_RED;
      doc.save();
      doc.roundedRect(doc.page.width - 180, infoY + 10, 100, 24, 12).fill(statusColor);
      doc.restore();
      doc.fontSize(10).fillColor(this.WHITE).text(status, doc.page.width - 180, infoY + 16, { width: 100, align: 'center' });

      doc.moveDown(3);

      // Items table
      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        const tableY = doc.y;
        const colWidths = [40, 220, 60, 90, 90];

        // Table header
        doc.save();
        doc.roundedRect(doc.page.margins.left, tableY, doc.page.width - 100, 28, 4).fill(this.PRIMARY_RED);
        doc.restore();
        doc.fontSize(10).fillColor(this.WHITE);
        doc.text('#', doc.page.margins.left + 15, tableY + 8, { width: 20 });
        doc.text('البند / Item', doc.page.margins.left + 55, tableY + 8, { width: 180 });
        doc.text('الكمية / Qty', doc.page.margins.left + 260, tableY + 8, { width: 50, align: 'center' });
        doc.text('السعر / Price', doc.page.margins.left + 340, tableY + 8, { width: 70, align: 'right' });
        doc.text('الإجمالي / Total', doc.page.margins.left + 430, tableY + 8, { width: 70, align: 'right' });

        let rowY = tableY + 28;
        data.items.forEach((item: any, index: number) => {
          const isEven = index % 2 === 0;
          const itemName = item.name || item.description || 'Item';
          const qty = item.quantity || 1;
          const price = item.price || item.priceSYP || 0;
          const total = item.total || (qty * price) || 0;

          doc.save();
          doc.roundedRect(doc.page.margins.left, rowY, doc.page.width - 100, 24, 2).fill(isEven ? this.WHITE : this.LIGHT_GRAY);
          doc.restore();

          doc.fontSize(9).fillColor(this.BLACK);
          doc.text(`${index + 1}`, doc.page.margins.left + 15, rowY + 6, { width: 20 });
          doc.text(itemName, doc.page.margins.left + 55, rowY + 6, { width: 180 });
          doc.text(`${qty}`, doc.page.margins.left + 260, rowY + 6, { width: 50, align: 'center' });
          doc.text(`${Number(price).toLocaleString()}`, doc.page.margins.left + 340, rowY + 6, { width: 70, align: 'right' });
          doc.text(`${Number(total).toLocaleString()}`, doc.page.margins.left + 430, rowY + 6, { width: 70, align: 'right' });

          rowY += 24;
        });

        doc.y = rowY + 10;
      }

      // Totals section
      const totalsY = doc.y;
      doc.save();
      doc.roundedRect(doc.page.width - 280, totalsY, 200, 110, 8).fill(this.LIGHT_GRAY);
      doc.restore();

      const labelX = doc.page.width - 270;
      const valueX = doc.page.width - 130;

      doc.fontSize(10).fillColor(this.GRAY).text('المجموع الفرعي / Subtotal:', labelX, totalsY + 12);
      doc.fontSize(10).fillColor(this.BLACK).text(`${Number(data.subtotal || 0).toLocaleString()}`, valueX, totalsY + 12, { align: 'right', width: 100 });

      doc.fontSize(10).fillColor(this.GRAY).text('الضريبة / Tax:', labelX, totalsY + 34);
      doc.fontSize(10).fillColor(this.BLACK).text(`${Number(data.tax || 0).toLocaleString()}`, valueX, totalsY + 34, { align: 'right', width: 100 });

      doc.fontSize(10).fillColor(this.GRAY).text('الخصم / Discount:', labelX, totalsY + 56);
      doc.fontSize(10).fillColor(this.BLACK).text(`${Number(data.discount || 0).toLocaleString()}`, valueX, totalsY + 56, { align: 'right', width: 100 });

      this.drawLine(doc, totalsY + 78, this.PRIMARY_RED);

      doc.fontSize(12).fillColor(this.PRIMARY_RED).text('الإجمالي / Total:', labelX, totalsY + 84);
      doc.fontSize(14).fillColor(this.PRIMARY_RED).text(`${Number(data.total || 0).toLocaleString()}`, valueX, totalsY + 82, { align: 'right', width: 100 });

      // Footer
      this.drawFooter(doc);

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
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      this.drawHeader(doc, data.reportTitle || 'Report', `Generated: ${new Date().toLocaleString()}`);

      if (data.summary) {
        const summaryY = doc.y;
        doc.save();
        doc.roundedRect(doc.page.margins.left, summaryY, doc.page.width - 100, 80, 8).fill(this.LIGHT_GRAY);
        doc.restore();

        doc.fontSize(12).fillColor(this.PRIMARY_RED).text('Summary', doc.page.margins.left + 15, summaryY + 12);
        let rowY = summaryY + 35;
        Object.entries(data.summary).forEach(([key, value]) => {
          doc.fontSize(10).fillColor(this.BLACK).text(`${key}: ${value}`, doc.page.margins.left + 15, rowY);
          rowY += 18;
        });
        doc.y = rowY + 10;
      }

      if (data.rows && Array.isArray(data.rows)) {
        doc.fontSize(14).fillColor(this.PRIMARY_RED).text('Details', doc.page.margins.left, doc.y + 10);
        doc.moveDown();
        data.rows.forEach((row: any, index: number) => {
          const text = Object.entries(row).map(([k, v]) => `${k}: ${v}`).join(' | ');
          doc.fontSize(9).fillColor(this.BLACK).text(`${index + 1}. ${text}`);
        });
      }

      this.drawFooter(doc);

      doc.end();
      stream.on('finish', () => resolve({ success: true, pdfUrl, pdfPath }));
      stream.on('error', reject);
    });
  }

  /**
   * Generate receipt PDF (Payment Receipt / Booking Receipt)
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

      // Header
      this.drawHeader(doc, 'إيصال دفع', `Payment Receipt ${data.receiptNumber || data.paymentId}`);

      // Receipt info card
      const cardY = doc.y;
      doc.save();
      doc.roundedRect(doc.page.margins.left, cardY, doc.page.width - 100, 200, 12).fill(this.LIGHT_GRAY);
      doc.restore();

      // Receipt number badge
      doc.save();
      doc.roundedRect(doc.page.margins.left + 15, cardY + 15, 180, 28, 14).fill(this.PRIMARY_RED);
      doc.restore();
      doc.fontSize(10).fillColor(this.WHITE).text(`رقم الإيصال / Receipt #`, doc.page.margins.left + 25, cardY + 21);
      doc.fontSize(12).fillColor(this.WHITE).text(`${data.receiptNumber || data.paymentId}`, doc.page.margins.left + 25, cardY + 21, { width: 160, align: 'right' });

      // Date badge
      doc.save();
      doc.roundedRect(doc.page.width - 260, cardY + 15, 180, 28, 14).fill(this.BLACK);
      doc.restore();
      doc.fontSize(10).fillColor(this.WHITE).text(`التاريخ / Date`, doc.page.width - 250, cardY + 21);
      doc.fontSize(11).fillColor(this.WHITE).text(`${data.paymentDate || new Date().toISOString().split('T')[0]}`, doc.page.width - 250, cardY + 21, { width: 160, align: 'right' });

      // Customer info
      doc.fontSize(11).fillColor(this.GRAY).text('العميل / Customer:', doc.page.margins.left + 15, cardY + 60);
      doc.fontSize(13).fillColor(this.BLACK).text(`${data.customerName || 'N/A'}`, doc.page.margins.left + 15, cardY + 78);

      this.drawLine(doc, cardY + 105, this.BORDER_GRAY);

      // Amount section
      doc.fontSize(11).fillColor(this.GRAY).text('المبلغ المدفوع / Amount Paid:', doc.page.margins.left + 15, cardY + 115);
      doc.fontSize(28).fillColor(this.PRIMARY_RED).text(`${Number(data.amount || 0).toLocaleString()}`, doc.page.margins.left + 15, cardY + 132);

      // Currency badge
      const currency = data.currency || 'SYP';
      doc.save();
      doc.roundedRect(doc.page.margins.left + 180, cardY + 135, 60, 24, 12).fill(this.PRIMARY_RED);
      doc.restore();
      doc.fontSize(11).fillColor(this.WHITE).text(currency, doc.page.margins.left + 180, cardY + 141, { width: 60, align: 'center' });

      // Payment method
      doc.fontSize(11).fillColor(this.GRAY).text('طريقة الدفع / Method:', doc.page.width - 260, cardY + 115);
      doc.fontSize(12).fillColor(this.BLACK).text(`${data.paymentMethod || 'N/A'}`, doc.page.width - 260, cardY + 132);

      // Invoice reference
      this.drawLine(doc, cardY + 170, this.BORDER_GRAY);
      doc.fontSize(10).fillColor(this.GRAY).text(`مرجع الفاتورة / Invoice Ref: ${data.invoiceNumber || data.invoiceId || 'N/A'}`, doc.page.margins.left + 15, cardY + 180);

      doc.moveDown(3);

      // Thank you message
      const msgY = doc.y + 20;
      doc.save();
      doc.roundedRect(doc.page.margins.left, msgY, doc.page.width - 100, 60, 8).fill('#FEF2F2');
      doc.restore();
      doc.fontSize(12).fillColor(this.PRIMARY_RED).text('شكراً لثقتكم بنا', doc.page.margins.left, msgY + 10, { width: doc.page.width - 100, align: 'center' });
      doc.fontSize(10).fillColor(this.BLACK).text('Thank you for your business', doc.page.margins.left, msgY + 30, { width: doc.page.width - 100, align: 'center' });
      doc.fontSize(9).fillColor(this.GRAY).text('AUTO RENEW - نظام إدارة مرآب السيارات', doc.page.margins.left, msgY + 48, { width: doc.page.width - 100, align: 'center' });

      // Footer
      this.drawFooter(doc);

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
