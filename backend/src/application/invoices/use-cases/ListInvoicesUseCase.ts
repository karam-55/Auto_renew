import { IInvoiceRepository } from '../interfaces/IInvoiceRepository';
import { ListInvoicesQuery } from '../queries/ListInvoicesQuery';
import { InvoiceDTO } from '../dto/InvoiceDTO';

export class ListInvoicesUseCase {
  constructor(private readonly invoiceRepository: IInvoiceRepository) {}

  async execute(query: ListInvoicesQuery): Promise<InvoiceDTO[]> {
    const { tenantId } = query;

    const invoices = await this.invoiceRepository.list(tenantId);

    return invoices.map(invoice => InvoiceDTO.fromEntity(invoice));
  }
}
