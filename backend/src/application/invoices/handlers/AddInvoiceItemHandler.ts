import { AddInvoiceItemUseCase } from '../use-cases/AddInvoiceItemUseCase';
import { AddInvoiceItemCommand } from '../commands/AddInvoiceItemCommand';

export class AddInvoiceItemHandler {
  constructor(private readonly addInvoiceItem: AddInvoiceItemUseCase) {}

  async handle(command: AddInvoiceItemCommand) {
    return await this.addInvoiceItem.execute(command);
  }
}
