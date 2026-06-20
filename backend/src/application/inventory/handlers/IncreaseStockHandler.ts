import { IncreaseStock } from '../use-cases/IncreaseStock';
import { IncreaseStockCommand } from '../commands/IncreaseStockCommand';

export class IncreaseStockHandler {
  constructor(private readonly increaseStock: IncreaseStock) {}

  async handle(command: IncreaseStockCommand) {
    const { dto } = command;
    return await this.increaseStock.execute(
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
