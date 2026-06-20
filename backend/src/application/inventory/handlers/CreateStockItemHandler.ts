import { CreatePart } from '../use-cases/CreatePart';
import { CreateStockItemCommand } from '../commands/CreateStockItemCommand';

export class CreateStockItemHandler {
  constructor(private readonly createPart: CreatePart) {}

  async handle(command: CreateStockItemCommand) {
    const { dto } = command;
    return await this.createPart.execute(
      dto.tenantId,
      dto.name,
      dto.costSYP,
      dto.sellingPriceSYP,
      dto.nameAr,
      dto.nameEn,
      dto.categoryId,
      dto.supplierId,
      dto.description,
      dto.costUSD,
      dto.sellingPriceUSD,
      dto.quantity,
      dto.minQuantity,
      dto.location,
      dto.isActive
    );
  }
}
