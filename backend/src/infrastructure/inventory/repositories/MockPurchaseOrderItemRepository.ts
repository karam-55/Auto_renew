import { PurchaseOrderItemRepository } from '../../../application/inventory/interfaces/PurchaseOrderItemRepository';
import { PurchaseOrderItem } from '../../../domain/inventory/po/entities/PurchaseOrderItem';

export class MockPurchaseOrderItemRepository implements PurchaseOrderItemRepository {
  private items: Map<string, PurchaseOrderItem> = new Map();

  async findById(id: string): Promise<PurchaseOrderItem | null> {
    return this.items.get(id) || null;
  }

  async findByPurchaseOrderId(purchaseOrderId: string): Promise<PurchaseOrderItem[]> {
    return Array.from(this.items.values()).filter(
      item => item.purchaseOrderId === purchaseOrderId
    );
  }

  async create(item: PurchaseOrderItem): Promise<PurchaseOrderItem> {
    this.items.set(item.id, item);
    return item;
  }

  async update(item: PurchaseOrderItem): Promise<PurchaseOrderItem> {
    this.items.set(item.id, item);
    return item;
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }
}
