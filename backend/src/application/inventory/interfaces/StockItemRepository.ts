import { StockItem } from '../../../domain/inventory/entities/StockItem';

export interface StockItemRepository {
  findById(id: string): Promise<StockItem | null>;
  findByPartId(partId: string): Promise<StockItem[]>;
  findByWarehouseId(warehouseId: string): Promise<StockItem[]>;
  create(stockItem: StockItem): Promise<StockItem>;
  update(stockItem: StockItem): Promise<StockItem>;
  delete(id: string): Promise<void>;
}
