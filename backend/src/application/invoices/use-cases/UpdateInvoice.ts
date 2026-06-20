import { InvoiceRepository } from '../interfaces/InvoiceRepository';
import { Invoice } from '../../../domain/invoices/entities/Invoice';

export class UpdateInvoice {
  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async execute(
    invoiceId: string,
    subtotalSYP?: number,
    totalSYP?: number,
    subtotalUSD?: number,
    totalUSD?: number,
    taxSYP?: number,
    taxUSD?: number,
    taxRateId?: string,
    discountSYP?: number,
    discountUSD?: number,
    loyaltyPointsEarned?: number,
    loyaltyPointsRedeemed?: number,
    notes?: string,
    dueDate?: Date
  ): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findById(invoiceId);

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const updatedInvoice = Invoice.create(
      invoice.id,
      invoice.tenantId,
      invoice.invoiceNumber,
      subtotalSYP || invoice.subtotalSYP,
      totalSYP || invoice.totalSYP,
      invoice.customerId,
      invoice.bookingId,
      invoice.invoiceDate,
      dueDate || invoice.dueDate,
      subtotalUSD !== undefined ? subtotalUSD : invoice.subtotalUSD,
      totalUSD !== undefined ? totalUSD : invoice.totalUSD,
      taxSYP !== undefined ? taxSYP : invoice.taxSYP,
      taxUSD !== undefined ? taxUSD : invoice.taxUSD,
      taxRateId !== undefined ? taxRateId : invoice.taxRateId,
      discountSYP !== undefined ? discountSYP : invoice.discountSYP,
      discountUSD !== undefined ? discountUSD : invoice.discountUSD,
      loyaltyPointsEarned !== undefined ? loyaltyPointsEarned : invoice.loyaltyPointsEarned,
      loyaltyPointsRedeemed !== undefined ? loyaltyPointsRedeemed : invoice.loyaltyPointsRedeemed,
      notes !== undefined ? notes : invoice.notes,
      invoice.installmentPlanId
    );

    return await this.invoiceRepository.update(updatedInvoice);
  }
}
