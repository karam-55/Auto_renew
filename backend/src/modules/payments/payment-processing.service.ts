import prisma from '../../config/database';

/**
 * Payment Processing Service
 * Manages payment processing and transactions
 * 
 * Handles payment creation, validation, and status updates
 */

export interface PaymentProcessing {
  id: string;
  tenantId: string;
  invoiceId: string;
  amountSYP: number;
  amountUSD: number;
  paymentMethod: string;
  paymentDate: Date;
  reference: string | null;
  notes: string | null;
  cashRegisterSessionId: string | null;
  createdAt: Date;
}

export class PaymentProcessingService {
  /**
   * Create a new payment
   */
  async createPayment(
    tenantId: string,
    invoiceId: string,
    amountSYP: number,
    amountUSD: number,
    paymentMethod: string,
    reference: string | null,
    notes: string | null,
    cashRegisterSessionId: string | null
  ): Promise<PaymentProcessing> {
    const payment = await prisma.payment.create({
      data: {
        tenantId,
        invoiceId,
        amountSYP,
        amountUSD,
        paymentMethod: paymentMethod as any,
        paymentDate: new Date(),
        reference,
        notes,
        cashRegisterSessionId
      }
    });

    return {
      id: payment.id,
      tenantId: payment.tenantId,
      invoiceId: payment.invoiceId,
      amountSYP: Number(payment.amountSYP),
      amountUSD: Number(payment.amountUSD || 0),
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate,
      reference: payment.reference,
      notes: payment.notes,
      cashRegisterSessionId: payment.cashRegisterSessionId,
      createdAt: payment.createdAt
    };
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string): Promise<PaymentProcessing | null> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    });

    if (!payment) return null;

    return {
      id: payment.id,
      tenantId: payment.tenantId,
      invoiceId: payment.invoiceId,
      amountSYP: Number(payment.amountSYP),
      amountUSD: Number(payment.amountUSD || 0),
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate,
      reference: payment.reference,
      notes: payment.notes,
      cashRegisterSessionId: payment.cashRegisterSessionId,
      createdAt: payment.createdAt
    };
  }

  /**
   * Get payments for invoice
   */
  async getInvoicePayments(invoiceId: string): Promise<PaymentProcessing[]> {
    const payments = await prisma.payment.findMany({
      where: { invoiceId },
      orderBy: { createdAt: 'desc' }
    });

    return payments.map(p => ({
      id: p.id,
      tenantId: p.tenantId,
      invoiceId: p.invoiceId,
      amountSYP: Number(p.amountSYP),
      amountUSD: Number(p.amountUSD || 0),
      paymentMethod: p.paymentMethod,
      paymentDate: p.paymentDate,
      reference: p.reference,
      notes: p.notes,
      cashRegisterSessionId: p.cashRegisterSessionId,
      createdAt: p.createdAt
    }));
  }

  /**
   * Update invoice payment status
   */
  async updateInvoicePaymentStatus(invoiceId: string): Promise<void> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true }
    });

    if (!invoice) return;

    const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amountSYP || 0), 0);
    const totalDue = Number(invoice.totalSYP);

    if (totalPaid >= totalDue) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'PAID' }
      });
    } else if (totalPaid > 0) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'PARTIALLY_PAID' }
      });
    }
  }

  /**
   * Get payment summary for dashboard
   */
  async getPaymentSummary(tenantId: string): Promise<{
    totalPayments: number;
    totalAmountSYP: number;
    totalAmountUSD: number;
    paymentsByMethod: Record<string, number>;
  }> {
    const payments = await prisma.payment.findMany({
      where: { tenantId }
    });

    const totalAmountSYP = payments.reduce((sum, p) => sum + Number(p.amountSYP || 0), 0);
    const totalAmountUSD = payments.reduce((sum, p) => sum + Number(p.amountUSD || 0), 0);

    const paymentsByMethod: Record<string, number> = {};
    for (const payment of payments) {
      if (!paymentsByMethod[payment.paymentMethod]) {
        paymentsByMethod[payment.paymentMethod] = 0;
      }
      paymentsByMethod[payment.paymentMethod]++;
    }

    return {
      totalPayments: payments.length,
      totalAmountSYP,
      totalAmountUSD,
      paymentsByMethod
    };
  }
}

export default new PaymentProcessingService();
