import { PaymentRepository } from '../../../application/invoices/interfaces/PaymentRepository';
import { Payment } from '../../../domain/invoices/entities/Payment';
import prisma from '../../../config/database';

export class PrismaPaymentRepository implements PaymentRepository {
  async findById(id: string): Promise<Payment | null> {
    const payment = await prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      return null;
    }

    return this.mapToDomain(payment);
  }

  async findByInvoiceId(invoiceId: string): Promise<Payment[]> {
    const payments = await prisma.payment.findMany({
      where: { invoiceId },
      orderBy: { paymentDate: 'desc' },
    });

    return payments.map(p => this.mapToDomain(p));
  }

  async findByTenantId(tenantId: string): Promise<Payment[]> {
    const payments = await prisma.payment.findMany({
      where: { tenantId },
      orderBy: { paymentDate: 'desc' },
    });

    return payments.map(p => this.mapToDomain(p));
  }

  async create(payment: Payment): Promise<Payment> {
    const createdPayment = await prisma.payment.create({
      data: {
        id: payment.id,
        tenantId: payment.tenantId,
        invoiceId: payment.invoiceId,
        amountSYP: payment.amountSYP,
        amountUSD: payment.amountUSD,
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod as any,
        reference: payment.reference,
        notes: payment.notes,
        cashRegisterSessionId: payment.cashRegisterSessionId,
        createdAt: payment.createdAt,
      },
    });

    return this.mapToDomain(createdPayment);
  }

  async delete(id: string): Promise<void> {
    await prisma.payment.delete({
      where: { id },
    });
  }

  async deleteByInvoiceId(invoiceId: string): Promise<void> {
    await prisma.payment.deleteMany({
      where: { invoiceId },
    });
  }

  private mapToDomain(prismaPayment: any): Payment {
    return new Payment(
      prismaPayment.id,
      prismaPayment.tenantId,
      prismaPayment.invoiceId,
      Number(prismaPayment.amountSYP),
      prismaPayment.paymentDate,
      prismaPayment.paymentMethod,
      prismaPayment.createdAt,
      prismaPayment.amountUSD ? Number(prismaPayment.amountUSD) : undefined,
      prismaPayment.reference,
      prismaPayment.notes,
      prismaPayment.cashRegisterSessionId
    );
  }
}
