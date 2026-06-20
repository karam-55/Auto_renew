import { AddItemToPO } from '../use-cases/AddItemToPO';
import { AddPOItemCommand } from '../commands/AddPOItemCommand';

export class AddPOItemHandler {
  constructor(private readonly addItemToPO: AddItemToPO) {}

  async handle(command: AddPOItemCommand) {
    const { dto } = command;
    return await this.addItemToPO.execute(
      dto.purchaseOrderId,
      dto.partId,
      dto.description,
      dto.quantity,
      dto.unitPrice
    );
  }
}
