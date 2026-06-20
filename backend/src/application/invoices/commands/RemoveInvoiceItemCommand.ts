import { RemoveInvoiceItemDTO } from '../dto/RemoveInvoiceItemDTO';

export class RemoveInvoiceItemCommand {
  constructor(public readonly dto: RemoveInvoiceItemDTO) {}
}
