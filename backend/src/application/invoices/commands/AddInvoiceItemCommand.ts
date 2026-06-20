import { AddInvoiceItemDTO } from '../dto/AddInvoiceItemDTO';

export class AddInvoiceItemCommand {
  constructor(public readonly dto: AddInvoiceItemDTO) {}
}
