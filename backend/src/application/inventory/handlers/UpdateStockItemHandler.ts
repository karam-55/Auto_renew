import { UpdatePart } from '../use-cases/UpdatePart';
import { UpdateStockItemCommand } from '../commands/UpdateStockItemCommand';

export class UpdateStockItemHandler {
  constructor(private readonly updatePart: UpdatePart) {}

  async handle(command: UpdateStockItemCommand) {
    const { stockItemId, dto } = command;
    return await this.updatePart.execute(
      stockItemId,
      dto.name,
      dto.nameAr,
      dto.nameEn,
      dto.description,
      dto.costSYP,
      dto.costUSD,
      dto.sellingPriceSYP,
      dto.sellingPriceUSD,
      dto.minQuantity,
      dto.location,
      dto.categoryId,
      dto.supplierId
    );
  }
}
