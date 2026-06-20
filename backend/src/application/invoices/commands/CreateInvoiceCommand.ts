import { CreateInvoiceDTO } from '../dto/CreateInvoiceDTO';

export class CreateInvoiceCommand {
  constructor(public readonly dto: CreateInvoiceDTO) {}
}
