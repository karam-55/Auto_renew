import { CalculateVATForInvoiceUseCase } from '../use-cases/CalculateVATForInvoiceUseCase';

export class CalculateVATForInvoiceHandler {
  constructor(private readonly calculateVATForInvoice: CalculateVATForInvoiceUseCase) {}

  async handle(invoiceId: string) {
    return await this.calculateVATForInvoice.execute(invoiceId);
  }
}
