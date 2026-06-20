import { DecreaseStock } from '../use-cases/DecreaseStock';
import { DecreaseStockCommand } from '../commands/DecreaseStockCommand';

export class DecreaseStockHandler {
  constructor(private readonly decreaseStock: DecreaseStock) {}

  async handle(command: DecreaseStockCommand) {
    const { dto } = command;
    return await this.decreaseStock.execute(
      dto.tenantId,
      dto.partId,
      dto.quantity,
      dto.costSYP,
      dto.costUSD,
      dto.warehouseId,
      dto.notes
    );
  }
}
