import { FinalizeInvoiceUseCase } from '../use-cases/FinalizeInvoiceUseCase';
import { FinalizeInvoiceCommand } from '../commands/FinalizeInvoiceCommand';

export class FinalizeInvoiceHandler {
  constructor(private readonly finalizeInvoice: FinalizeInvoiceUseCase) {}

  async handle(command: FinalizeInvoiceCommand) {
    return await this.finalizeInvoice.execute(command);
  }
}
