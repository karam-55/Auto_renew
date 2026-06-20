import { Request, Response } from 'express';
import { InvoiceService } from './service';
import { AuthRequest, authorize } from '../../shared/middlewares/auth';
import { CreateInvoiceDto, UpdateInvoiceDto } from './types';
import { logAuditFromRequest } from '../../middleware/audit.middleware';
import { Logger } from '../../infrastructure/logging/logger';

export class InvoiceController {
  private invoiceService: InvoiceService;

  constructor() {
    this.invoiceService = new InvoiceService();
  }

  setIo(io: any) {
    this.invoiceService.setIo(io);
  }

  createInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const data: CreateInvoiceDto = req.body;

      // Handle date conversions
      if (data.invoiceDate && typeof data.invoiceDate === 'string') {
        data.invoiceDate = new Date(data.invoiceDate);
      }
      if (data.dueDate && typeof data.dueDate === 'string') {
        data.dueDate = new Date(data.dueDate);
      }

      const invoice = await this.invoiceService.createInvoice(tenantId, userId, data);

      // Log invoice creation
      logAuditFromRequest(req, 'INVOICE_CREATED', 'Invoice', invoice.id, null, invoice);

      res.status(201).json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      Logger.error('Create invoice error', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create invoice',
      });
    }
  };

  getInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const filters = {
        status: req.query.status as any,
        customerId: req.query.customerId as string,
        bookingId: req.query.bookingId as string,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        search: req.query.search as string,
      };

      const invoices = await this.invoiceService.getInvoices(tenantId, filters);

      res.status(200).json({
        success: true,
        data: invoices,
        totalPages: 1,
      });
    } catch (error) {
      Logger.error('Get invoices error', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get invoices',
      });
    }
  };

  getInvoiceById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;

      const invoice = await this.invoiceService.getInvoiceById(tenantId, id);

      res.status(200).json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      Logger.error('Get invoice by ID error', error);
      if (error instanceof Error && error.message === 'NOT_FOUND') {
        res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
        });
      } else {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get invoice',
        });
      }
    }
  };

  updateInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const data: UpdateInvoiceDto = req.body;

      const oldInvoice = await this.invoiceService.getInvoiceById(tenantId, id);
      const invoice = await this.invoiceService.updateInvoice(tenantId, id, data);

      // Log invoice update
      logAuditFromRequest(req, 'INVOICE_UPDATED', 'Invoice', id, oldInvoice, invoice);

      res.status(200).json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      Logger.error('Update invoice error', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update invoice',
      });
    }
  };

  deleteInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;

      const oldInvoice = await this.invoiceService.getInvoiceById(tenantId, id);
      await this.invoiceService.deleteInvoice(tenantId, id);

      // Log invoice deletion
      logAuditFromRequest(req, 'INVOICE_DELETED', 'Invoice', id, oldInvoice, null);

      res.status(200).json({
        success: true,
        message: 'Invoice deleted successfully',
      });
    } catch (error) {
      Logger.error('Delete invoice error', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete invoice',
      });
    }
  };

  finalizeInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;

      const invoice = await this.invoiceService.finalizeInvoice(tenantId, id);

      // Log invoice finalization
      logAuditFromRequest(req, 'INVOICE_FINALIZED', 'Invoice', id, null, invoice);

      res.status(200).json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      Logger.error('Finalize invoice error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to finalize invoice',
      });
    }
  };

  cancelInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;

      const invoice = await this.invoiceService.cancelInvoice(tenantId, id);

      // Log invoice cancellation
      logAuditFromRequest(req, 'INVOICE_CANCELLED', 'Invoice', id, null, invoice);

      res.status(200).json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      Logger.error('Cancel invoice error:', error);
      if (error instanceof Error && error.message === 'CANNOT_CANCEL_INVOICE') {
        res.status(400).json({
          success: false,
          error: 'CANNOT_CANCEL_INVOICE',
        });
      } else {
        res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to cancel invoice',
        });
      }
    }
  };

  payInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;

      const invoice = await this.invoiceService.payInvoice(tenantId, id);

      res.status(200).json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      Logger.error('Pay invoice error:', error);
      if (error instanceof Error) {
        if (error.message === 'CANNOT_PAY_DRAFT') {
          res.status(400).json({
            success: false,
            error: 'CANNOT_PAY_DRAFT',
          });
        } else if (error.message === 'CANNOT_PAY_CANCELLED') {
          res.status(400).json({
            success: false,
            error: 'CANNOT_PAY_CANCELLED',
          });
        } else if (error.message === 'ALREADY_PAID') {
          res.status(400).json({
            success: false,
            error: 'ALREADY_PAID',
          });
        } else {
          res.status(400).json({
            success: false,
            error: error.message,
          });
        }
      } else {
        res.status(400).json({
          success: false,
          error: 'Failed to pay invoice',
        });
      }
    }
  };

  getInvoiceSummaries = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const filters = {
        status: req.query.status as any,
        customerId: req.query.customerId as string,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      };

      const summaries = await this.invoiceService.getInvoiceSummaries(tenantId, filters);

      res.status(200).json({
        success: true,
        data: summaries,
      });
    } catch (error) {
      Logger.error('Get invoice summaries error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get invoice summaries',
      });
    }
  };
}