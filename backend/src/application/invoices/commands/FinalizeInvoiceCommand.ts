import { FinalizeInvoiceDTO } from '../dto/FinalizeInvoiceDTO';

export class FinalizeInvoiceCommand {
  constructor(public readonly dto: FinalizeInvoiceDTO) {}
}
