import { StockItemRepository } from '../interfaces/StockItemRepository';
import { StockItem } from '../../../domain/inventory/entities/StockItem';

export class ListStockItems {
  constructor(private readonly stockItemRepository: StockItemRepository) {}

  async executeByPart(partId: string): Promise<StockItem[]> {
    return await this.stockItemRepository.findByPartId(partId);
  }

  async executeByWarehouse(warehouseId: string): Promise<StockItem[]> {
    return await this.stockItemRepository.findByWarehouseId(warehouseId);
  }
}
