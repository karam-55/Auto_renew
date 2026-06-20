import { AdjustStock } from '../use-cases/AdjustStock';
import { AdjustStockCommand } from '../commands/AdjustStockCommand';

export class AdjustStockHandler {
  constructor(private readonly adjustStock: AdjustStock) {}

  async handle(command: AdjustStockCommand) {
    const { dto } = command;
    return await this.adjustStock.execute(
      dto.tenantId,
      dto.partId,
      dto.newQuantity,
      dto.reason,
      dto.warehouseId,
      dto.adjustedBy
    );
  }
}
