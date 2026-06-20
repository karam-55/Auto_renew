import { RemoveInvoiceItemUseCase } from '../use-cases/RemoveInvoiceItemUseCase';
import { RemoveInvoiceItemCommand } from '../commands/RemoveInvoiceItemCommand';

export class RemoveInvoiceItemHandler {
  constructor(private readonly removeInvoiceItem: RemoveInvoiceItemUseCase) {}

  async handle(command: RemoveInvoiceItemCommand) {
    return await this.removeInvoiceItem.execute(command);
  }
}
