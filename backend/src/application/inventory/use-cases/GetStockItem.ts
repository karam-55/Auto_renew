import { StockItemRepository } from '../interfaces/StockItemRepository';
import { StockItem } from '../../../domain/inventory/entities/StockItem';

export class GetStockItem {
  constructor(private readonly stockItemRepository: StockItemRepository) {}

  async execute(stockItemId: string): Promise<StockItem> {
    const stockItem = await this.stockItemRepository.findById(stockItemId);

    if (!stockItem) {
      throw new Error('Stock item not found');
    }

    return stockItem;
  }
}
