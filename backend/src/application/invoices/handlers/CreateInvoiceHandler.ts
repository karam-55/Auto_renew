import { CreateInvoiceUseCase } from '../use-cases/CreateInvoiceUseCase';
import { CreateInvoiceCommand } from '../commands/CreateInvoiceCommand';

export class CreateInvoiceHandler {
  constructor(private readonly createInvoice: CreateInvoiceUseCase) {}

  async handle(command: CreateInvoiceCommand) {
    return await this.createInvoice.execute(command);
  }
}
