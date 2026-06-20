import { Request, Response } from 'express';
import { Logger } from '../../../infrastructure/logging/logger';
import { CreateInvoice } from '../../../application/invoices/use-cases/CreateInvoice';
import { UpdateInvoice } from '../../../application/invoices/use-cases/UpdateInvoice';
import { GetInvoice } from '../../../application/invoices/use-cases/GetInvoice';
import { ListInvoices } from '../../../application/invoices/use-cases/ListInvoices';
import { PrismaInvoiceRepository } from '../../../infrastructure/invoices/repositories/PrismaInvoiceRepository';
import { InvoiceStatus } from '../../../domain/invoices/entities/Invoice';

export class InvoiceController {
  private createInvoice: CreateInvoice;
  private updateInvoice: UpdateInvoice;
  private getInvoice: GetInvoice;
  private listInvoices: ListInvoices;

  constructor() {
    const invoiceRepository = new PrismaInvoiceRepository();
    this.createInvoice = new CreateInvoice(invoiceRepository);
    this.updateInvoice = new UpdateInvoice(invoiceRepository);
    this.getInvoice = new GetInvoice(invoiceRepository);
    this.listInvoices = new ListInvoices(invoiceRepository);
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        tenantId,
        subtotalSYP,
        totalSYP,
        customerId,
        bookingId,
        invoiceDate,
        dueDate,
        subtotalUSD,
        totalUSD,
        taxSYP,
        taxUSD,
        taxRateId,
        discountSYP,
        discountUSD,
        loyaltyPointsEarned,
        loyaltyPointsRedeemed,
        notes,
        installmentPlanId,
      } = req.body;

      const result = await this.createInvoice.execute(
        tenantId,
        subtotalSYP,
        totalSYP,
        customerId,
        bookingId,
        invoiceDate ? new Date(invoiceDate) : undefined,
        dueDate ? new Date(dueDate) : undefined,
        subtotalUSD,
        totalUSD,
        taxSYP,
        taxUSD,
        taxRateId,
        discountSYP,
        discountUSD,
        loyaltyPointsEarned,
        loyaltyPointsRedeemed,
        notes,
        installmentPlanId
      );

      res.status(201).json({
        id: result.invoice.id,
        tenantId: result.invoice.tenantId,
        customerId: result.invoice.customerId,
        bookingId: result.invoice.bookingId,
        invoiceNumber: result.invoice.invoiceNumber.getValue(),
        invoiceDate: result.invoice.invoiceDate,
        dueDate: result.invoice.dueDate,
        subtotalSYP: result.invoice.subtotalSYP,
        subtotalUSD: result.invoice.subtotalUSD,
        taxSYP: result.invoice.taxSYP,
        taxUSD: result.invoice.taxUSD,
        taxRateId: result.invoice.taxRateId,
        discountSYP: result.invoice.discountSYP,
        discountUSD: result.invoice.discountUSD,
        loyaltyPointsEarned: result.invoice.loyaltyPointsEarned,
        loyaltyPointsRedeemed: result.invoice.loyaltyPointsRedeemed,
        totalSYP: result.invoice.totalSYP,
        totalUSD: result.invoice.totalUSD,
        paidSYP: result.invoice.paidSYP,
        paidUSD: result.invoice.paidUSD,
        status: result.invoice.status,
        notes: result.invoice.notes,
        installmentPlanId: result.invoice.installmentPlanId,
        createdAt: result.invoice.createdAt,
        updatedAt: result.invoice.updatedAt,
      });
    } catch (error) {
      Logger.error('Create invoice error:', error);
      res.status(500).json({ error: 'Failed to create invoice' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        subtotalSYP,
        totalSYP,
        subtotalUSD,
        totalUSD,
        taxSYP,
        taxUSD,
        taxRateId,
        discountSYP,
        discountUSD,
        loyaltyPointsEarned,
        loyaltyPointsRedeemed,
        notes,
        dueDate,
      } = req.body;

      const invoice = await this.updateInvoice.execute(
        id,
        subtotalSYP,
        totalSYP,
        subtotalUSD,
        totalUSD,
        taxSYP,
        taxUSD,
        taxRateId,
        discountSYP,
        discountUSD,
        loyaltyPointsEarned,
        loyaltyPointsRedeemed,
        notes,
        dueDate ? new Date(dueDate) : undefined
      );

      res.json({
        id: invoice.id,
        tenantId: invoice.tenantId,
        customerId: invoice.customerId,
        bookingId: invoice.bookingId,
        invoiceNumber: invoice.invoiceNumber.getValue(),
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        subtotalSYP: invoice.subtotalSYP,
        subtotalUSD: invoice.subtotalUSD,
        taxSYP: invoice.taxSYP,
        taxUSD: invoice.taxUSD,
        taxRateId: invoice.taxRateId,
        discountSYP: invoice.discountSYP,
        discountUSD: invoice.discountUSD,
        loyaltyPointsEarned: invoice.loyaltyPointsEarned,
        loyaltyPointsRedeemed: invoice.loyaltyPointsRedeemed,
        totalSYP: invoice.totalSYP,
        totalUSD: invoice.totalUSD,
        paidSYP: invoice.paidSYP,
        paidUSD: invoice.paidUSD,
        status: invoice.status,
        notes: invoice.notes,
        installmentPlanId: invoice.installmentPlanId,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
      });
    } catch (error) {
      Logger.error('Update invoice error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update invoice';
      if (errorMessage === 'Invoice not found') {
        res.status(404).json({ error: errorMessage });
        return;
      }
      res.status(500).json({ error: 'Failed to update invoice' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const invoice = await this.getInvoice.execute(id);

      res.json({
        id: invoice.id,
        tenantId: invoice.tenantId,
        customerId: invoice.customerId,
        bookingId: invoice.bookingId,
        invoiceNumber: invoice.invoiceNumber.getValue(),
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        subtotalSYP: invoice.subtotalSYP,
        subtotalUSD: invoice.subtotalUSD,
        taxSYP: invoice.taxSYP,
        taxUSD: invoice.taxUSD,
        taxRateId: invoice.taxRateId,
        discountSYP: invoice.discountSYP,
        discountUSD: invoice.discountUSD,
        loyaltyPointsEarned: invoice.loyaltyPointsEarned,
        loyaltyPointsRedeemed: invoice.loyaltyPointsRedeemed,
        totalSYP: invoice.totalSYP,
        totalUSD: invoice.totalUSD,
        paidSYP: invoice.paidSYP,
        paidUSD: invoice.paidUSD,
        status: invoice.status,
        notes: invoice.notes,
        installmentPlanId: invoice.installmentPlanId,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
      });
    } catch (error) {
      Logger.error('Get invoice error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get invoice';
      if (errorMessage === 'Invoice not found') {
        res.status(404).json({ error: errorMessage });
        return;
      }
      res.status(500).json({ error: 'Failed to get invoice' });
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, customerId, bookingId, status } = req.query;

      let invoices;
      if (customerId && typeof customerId === 'string') {
        invoices = await this.listInvoices.executeByCustomer(customerId);
      } else if (bookingId && typeof bookingId === 'string') {
        invoices = await this.listInvoices.executeByBooking(bookingId);
      } else if (status && tenantId && typeof tenantId === 'string') {
        invoices = await this.listInvoices.executeByStatus(tenantId, status as InvoiceStatus);
      } else if (tenantId && typeof tenantId === 'string') {
        invoices = await this.listInvoices.execute(tenantId);
      } else {
        res.status(400).json({ error: 'Tenant ID is required' });
        return;
      }

      res.json(
        invoices.map(invoice => ({
          id: invoice.id,
          tenantId: invoice.tenantId,
          customerId: invoice.customerId,
          bookingId: invoice.bookingId,
          invoiceNumber: invoice.invoiceNumber.getValue(),
          invoiceDate: invoice.invoiceDate,
          dueDate: invoice.dueDate,
          subtotalSYP: invoice.subtotalSYP,
          subtotalUSD: invoice.subtotalUSD,
          taxSYP: invoice.taxSYP,
          taxUSD: invoice.taxUSD,
          taxRateId: invoice.taxRateId,
          discountSYP: invoice.discountSYP,
          discountUSD: invoice.discountUSD,
          loyaltyPointsEarned: invoice.loyaltyPointsEarned,
          loyaltyPointsRedeemed: invoice.loyaltyPointsRedeemed,
          totalSYP: invoice.totalSYP,
          totalUSD: invoice.totalUSD,
          paidSYP: invoice.paidSYP,
          paidUSD: invoice.paidUSD,
          status: invoice.status,
          notes: invoice.notes,
          installmentPlanId: invoice.installmentPlanId,
          createdAt: invoice.createdAt,
          updatedAt: invoice.updatedAt,
        }))
      );
    } catch (error) {
      Logger.error('List invoices error:', error);
      res.status(500).json({ error: 'Failed to list invoices' });
    }
  }
}
