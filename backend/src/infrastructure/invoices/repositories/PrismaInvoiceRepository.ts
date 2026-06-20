import { InvoiceRepository } from '../../../application/invoices/interfaces/InvoiceRepository';
import { Invoice } from '../../../domain/invoices/entities/Invoice';
import { InvoiceNumber } from '../../../domain/invoices/value-objects/InvoiceNumber';
import { InvoiceStatus } from '../../../domain/invoices/entities/Invoice';
import prisma from '../../../config/database';

export class PrismaInvoiceRepository implements InvoiceRepository {
  async findById(id: string): Promise<Invoice | null> {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return null;
    }

    return this.mapToDomain(invoice);
  }

  async findByInvoiceNumber(invoiceNumber: InvoiceNumber): Promise<Invoice | null> {
    const invoice = await prisma.invoice.findUnique({
      where: { invoiceNumber: invoiceNumber.getValue() },
    });

    if (!invoice) {
      return null;
    }

    return this.mapToDomain(invoice);
  }

  async findByCustomerId(customerId: string): Promise<Invoice[]> {
    const invoices = await prisma.invoice.findMany({
      where: { customerId },
      orderBy: { invoiceDate: 'desc' },
    });

    return invoices.map(i => this.mapToDomain(i));
  }

  async findByBookingId(bookingId: string): Promise<Invoice[]> {
    const invoices = await prisma.invoice.findMany({
      where: { bookingId },
      orderBy: { invoiceDate: 'desc' },
    });

    return invoices.map(i => this.mapToDomain(i));
  }

  async findByTenantId(tenantId: string): Promise<Invoice[]> {
    const invoices = await prisma.invoice.findMany({
      where: { tenantId },
      orderBy: { invoiceDate: 'desc' },
    });

    return invoices.map(i => this.mapToDomain(i));
  }

  async findByStatus(tenantId: string, status: InvoiceStatus): Promise<Invoice[]> {
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: status as any,
      },
      orderBy: { invoiceDate: 'desc' },
    });

    return invoices.map(i => this.mapToDomain(i));
  }

  async create(invoice: Invoice): Promise<Invoice> {
    const createdInvoice = await prisma.invoice.create({
      data: {
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
        status: invoice.status as any,
        notes: invoice.notes,
        installmentPlanId: invoice.installmentPlanId,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
      },
    });

    return this.mapToDomain(createdInvoice);
  }

  async update(invoice: Invoice): Promise<Invoice> {
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        customerId: invoice.customerId,
        bookingId: invoice.bookingId,
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
        status: invoice.status as any,
        notes: invoice.notes,
        installmentPlanId: invoice.installmentPlanId,
        updatedAt: invoice.updatedAt,
      },
    });

    return this.mapToDomain(updatedInvoice);
  }

  async delete(id: string): Promise<void> {
    await prisma.invoice.delete({
      where: { id },
    });
  }

  private mapToDomain(prismaInvoice: any): Invoice {
    const invoiceNumber = new InvoiceNumber(prismaInvoice.invoiceNumber);

    return new Invoice(
      prismaInvoice.id,
      prismaInvoice.tenantId,
      invoiceNumber,
      prismaInvoice.invoiceDate,
      Number(prismaInvoice.subtotalSYP),
      Number(prismaInvoice.taxSYP),
      Number(prismaInvoice.discountSYP),
      prismaInvoice.loyaltyPointsEarned,
      prismaInvoice.loyaltyPointsRedeemed,
      Number(prismaInvoice.totalSYP),
      Number(prismaInvoice.paidSYP),
      Number(prismaInvoice.paidUSD),
      prismaInvoice.status as InvoiceStatus,
      prismaInvoice.customerId,
      prismaInvoice.bookingId,
      prismaInvoice.dueDate,
      prismaInvoice.subtotalUSD ? Number(prismaInvoice.subtotalUSD) : undefined,
      prismaInvoice.taxUSD ? Number(prismaInvoice.taxUSD) : undefined,
      prismaInvoice.taxRateId,
      prismaInvoice.discountUSD ? Number(prismaInvoice.discountUSD) : undefined,
      prismaInvoice.totalUSD ? Number(prismaInvoice.totalUSD) : undefined,
      prismaInvoice.notes,
      prismaInvoice.installmentPlanId,
      prismaInvoice.createdAt,
      prismaInvoice.updatedAt
    );
  }
}
