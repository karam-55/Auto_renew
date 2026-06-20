import { InvoiceItemRepository } from '../../../application/invoices/interfaces/InvoiceItemRepository';
import { InvoiceItem } from '../../../domain/invoices/entities/InvoiceItem';
import prisma from '../../../config/database';

export class PrismaInvoiceItemRepository implements InvoiceItemRepository {
  async findById(id: string): Promise<InvoiceItem | null> {
    const invoiceItem = await prisma.invoiceItem.findUnique({
      where: { id },
    });

    if (!invoiceItem) {
      return null;
    }

    return this.mapToDomain(invoiceItem);
  }

  async findByInvoiceId(invoiceId: string): Promise<InvoiceItem[]> {
    const invoiceItems = await prisma.invoiceItem.findMany({
      where: { invoiceId },
    });

    return invoiceItems.map(i => this.mapToDomain(i));
  }

  async create(invoiceItem: InvoiceItem): Promise<InvoiceItem> {
    const createdInvoiceItem = await prisma.invoiceItem.create({
      data: {
        id: invoiceItem.id,
        invoiceId: invoiceItem.invoiceId,
        partId: invoiceItem.partId,
        description: invoiceItem.description,
        quantity: invoiceItem.quantity,
        priceSYP: invoiceItem.priceSYP,
        priceUSD: invoiceItem.priceUSD,
        totalSYP: invoiceItem.totalSYP,
        totalUSD: invoiceItem.totalUSD,
      },
    });

    return this.mapToDomain(createdInvoiceItem);
  }

  async update(invoiceItem: InvoiceItem): Promise<InvoiceItem> {
    const updatedInvoiceItem = await prisma.invoiceItem.update({
      where: { id: invoiceItem.id },
      data: {
        description: invoiceItem.description,
        quantity: invoiceItem.quantity,
        priceSYP: invoiceItem.priceSYP,
        priceUSD: invoiceItem.priceUSD,
        totalSYP: invoiceItem.totalSYP,
        totalUSD: invoiceItem.totalUSD,
      },
    });

    return this.mapToDomain(updatedInvoiceItem);
  }

  async delete(id: string): Promise<void> {
    await prisma.invoiceItem.delete({
      where: { id },
    });
  }

  async deleteByInvoiceId(invoiceId: string): Promise<void> {
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId },
    });
  }

  private mapToDomain(prismaInvoiceItem: any): InvoiceItem {
    return new InvoiceItem(
      prismaInvoiceItem.id,
      prismaInvoiceItem.invoiceId,
      prismaInvoiceItem.description,
      prismaInvoiceItem.quantity,
      Number(prismaInvoiceItem.priceSYP),
      Number(prismaInvoiceItem.totalSYP),
      prismaInvoiceItem.createdAt,
      prismaInvoiceItem.priceUSD ? Number(prismaInvoiceItem.priceUSD) : undefined,
      prismaInvoiceItem.totalUSD ? Number(prismaInvoiceItem.totalUSD) : undefined,
      prismaInvoiceItem.partId
    );
  }
}
