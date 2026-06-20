import { Request, Response } from 'express';
import { ErrorMiddleware } from '../../middlewares/error.middleware';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { InvoiceRepository } from '../../../infrastructure/repositories/invoices/InvoiceRepository';

export class InvoiceController {
  private invoiceRepository: InvoiceRepository;

  constructor() {
    this.invoiceRepository = new InvoiceRepository();
  }

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { customerId, bookingId, invoiceNumber, invoiceDate, dueDate, items } = req.body;
      const tenantId = req.user?.tenantId || 'default';

      const invoice = await this.invoiceRepository.save({
        id: crypto.randomUUID(),
        tenantId,
        customerId,
        bookingId,
        invoiceNumber,
        invoiceDate,
        dueDate,
        subtotalSYP: 0,
        subtotalUSD: 0,
        taxSYP: 0,
        taxUSD: 0,
        discountSYP: 0,
        discountUSD: 0,
        totalSYP: 0,
        totalUSD: 0,
        status: 'DRAFT',
      });

      ErrorMiddleware.success(res, invoice, 201);
    } catch (error) {
      ErrorMiddleware.error(res, 'CREATE_ERROR', 'Failed to create invoice', 500);
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const invoice = await this.invoiceRepository.findById(id);

      if (!invoice) {
        ErrorMiddleware.error(res, 'NOT_FOUND', 'Invoice not found', 404);
        return;
      }

      ErrorMiddleware.success(res, invoice, 200);
    } catch (error) {
      ErrorMiddleware.error(res, 'FETCH_ERROR', 'Failed to fetch invoice', 500);
    }
  }

  async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || 'default';
      const invoices = await this.invoiceRepository.list(tenantId);

      ErrorMiddleware.success(res, invoices, 200);
    } catch (error) {
      ErrorMiddleware.error(res, 'FETCH_ERROR', 'Failed to list invoices', 500);
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { subtotalSYP, subtotalUSD, taxSYP, taxUSD, discountSYP, discountUSD, totalSYP, totalUSD, status, notes } = req.body;

      const invoice = await this.invoiceRepository.update({
        id,
        subtotalSYP,
        subtotalUSD,
        taxSYP,
        taxUSD,
        discountSYP,
        discountUSD,
        totalSYP,
        totalUSD,
        status,
        notes,
      });

      ErrorMiddleware.success(res, invoice, 200);
    } catch (error) {
      ErrorMiddleware.error(res, 'UPDATE_ERROR', 'Failed to update invoice', 500);
    }
  }

  async findByBooking(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      const invoice = await this.invoiceRepository.findByBookingId(bookingId);

      ErrorMiddleware.success(res, invoice, 200);
    } catch (error) {
      ErrorMiddleware.error(res, 'FETCH_ERROR', 'Failed to find invoice by booking', 500);
    }
  }
}
