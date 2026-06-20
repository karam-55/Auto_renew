import { IInvoiceRepository } from '../interfaces/IInvoiceRepository';
import { RemoveInvoiceItemCommand } from '../commands/RemoveInvoiceItemCommand';
import { InvoiceDTO } from '../dto/InvoiceDTO';

export class RemoveInvoiceItemUseCase {
  constructor(private readonly invoiceRepository: IInvoiceRepository) {}

  async execute(command: RemoveInvoiceItemCommand): Promise<InvoiceDTO> {
    const { dto } = command;

    // Validate DTO
    const validation = dto.validate();
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // Find invoice
    const invoice = await this.invoiceRepository.findById(dto.invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Check if invoice is finalized
    if (invoice.isFinalized) {
      throw new Error('Cannot modify finalized invoice');
    }

    // Find the item
    const itemExists = invoice.items.find((item: any) => item.id === dto.itemId);
    if (!itemExists) {
      throw new Error('Invoice item not found');
    }

    // Remove invoice item
    const updatedItems = invoice.items.filter((item: any) => item.id !== dto.itemId);
    const subtotal = updatedItems.reduce((sum: number, item: any) => sum + item.total, 0);
    const tax = subtotal * 0.15; // 15% tax
    const total = subtotal + tax;

    const updatedInvoice = {
      ...invoice,
      items: updatedItems,
      subtotal,
      tax,
      total,
      updatedAt: new Date(),
    };

    const savedInvoice = await this.invoiceRepository.update(updatedInvoice);

    return InvoiceDTO.fromEntity(savedInvoice);
  }
}
