import { IInvoiceRepository } from '../interfaces/IInvoiceRepository';
import { GetInvoiceByIdQuery } from '../queries/GetInvoiceByIdQuery';
import { InvoiceDTO } from '../dto/InvoiceDTO';

export class GetInvoiceByIdUseCase {
  constructor(private readonly invoiceRepository: IInvoiceRepository) {}

  async execute(query: GetInvoiceByIdQuery): Promise<InvoiceDTO> {
    const { invoiceId } = query;

    const invoice = await this.invoiceRepository.findById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    return InvoiceDTO.fromEntity(invoice);
  }
}
