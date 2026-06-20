import { IInvoiceRepository } from '../interfaces/IInvoiceRepository';
import { AddInvoiceItemCommand } from '../commands/AddInvoiceItemCommand';
import { InvoiceDTO } from '../dto/InvoiceDTO';

export class AddInvoiceItemUseCase {
  constructor(private readonly invoiceRepository: IInvoiceRepository) {}

  async execute(command: AddInvoiceItemCommand): Promise<InvoiceDTO> {
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

    // Add invoice item
    const newItem = {
      id: `${dto.invoiceId}-item-${Date.now()}`,
      description: dto.description,
      quantity: dto.quantity,
      unitPrice: dto.unitPrice,
      type: dto.type.toUpperCase(),
      total: dto.quantity * dto.unitPrice,
    };

    const updatedItems = [...invoice.items, newItem];
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
