import { AddGRNItem } from '../use-cases/AddGRNItem';
import { AddGRNItemCommand } from '../commands/AddGRNItemCommand';

export class AddGRNItemHandler {
  constructor(private readonly addGRNItem: AddGRNItem) {}

  async handle(command: AddGRNItemCommand) {
    const { dto } = command;
    return await this.addGRNItem.execute(
      dto.grnId,
      dto.purchaseOrderItemId,
      dto.partId,
      dto.description,
      dto.orderedQuantity,
      dto.receivedQuantity,
      dto.unitPrice
    );
  }
}
