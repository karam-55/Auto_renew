import { Request, Response } from 'express';
import { Logger } from '../../../infrastructure/logging/logger';
import { RecordPayment } from '../../../application/invoices/use-cases/RecordPayment';
import { RefundPayment } from '../../../application/invoices/use-cases/RefundPayment';
import { PrismaPaymentRepository } from '../../../infrastructure/invoices/repositories/PrismaPaymentRepository';
import { PrismaInvoiceRepository } from '../../../infrastructure/invoices/repositories/PrismaInvoiceRepository';
import { PaymentMethod } from '../../../domain/invoices/entities/Payment';

export class PaymentController {
  private recordPayment: RecordPayment;
  private refundPayment: RefundPayment;

  constructor() {
    const paymentRepository = new PrismaPaymentRepository();
    const invoiceRepository = new PrismaInvoiceRepository();
    this.recordPayment = new RecordPayment(paymentRepository, invoiceRepository);
    this.refundPayment = new RefundPayment(paymentRepository, invoiceRepository);
  }

  async record(req: Request, res: Response): Promise<void> {
    try {
      const {
        tenantId,
        invoiceId,
        amountSYP,
        paymentMethod,
        amountUSD,
        paymentDate,
        reference,
        notes,
        cashRegisterSessionId,
      } = req.body;

      const result = await this.recordPayment.execute(
        tenantId,
        invoiceId,
        amountSYP,
        paymentMethod as PaymentMethod,
        amountUSD,
        paymentDate ? new Date(paymentDate) : undefined,
        reference,
        notes,
        cashRegisterSessionId
      );

      res.status(201).json({
        id: result.payment.id,
        tenantId: result.payment.tenantId,
        invoiceId: result.payment.invoiceId,
        amountSYP: result.payment.amountSYP,
        amountUSD: result.payment.amountUSD,
        paymentDate: result.payment.paymentDate,
        paymentMethod: result.payment.paymentMethod,
        reference: result.payment.reference,
        notes: result.payment.notes,
        cashRegisterSessionId: result.payment.cashRegisterSessionId,
        createdAt: result.payment.createdAt,
      });
    } catch (error) {
      Logger.error('Record payment error:', error);
      res.status(500).json({ error: 'Failed to record payment' });
    }
  }

  async refund(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const refund = await this.refundPayment.execute(id);

      res.json({
        id: refund.id,
        tenantId: refund.tenantId,
        invoiceId: refund.invoiceId,
        amountSYP: refund.amountSYP,
        amountUSD: refund.amountUSD,
        paymentDate: refund.paymentDate,
        paymentMethod: refund.paymentMethod,
        reference: refund.reference,
        notes: refund.notes,
        cashRegisterSessionId: refund.cashRegisterSessionId,
        createdAt: refund.createdAt,
      });
    } catch (error) {
      Logger.error('Refund payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to refund payment';
      if (errorMessage === 'Payment not found') {
        res.status(404).json({ error: errorMessage });
        return;
      }
      res.status(500).json({ error: 'Failed to refund payment' });
    }
  }
}
