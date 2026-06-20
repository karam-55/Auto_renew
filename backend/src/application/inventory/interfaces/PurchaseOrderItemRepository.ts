import { PurchaseOrderItem } from '../../../domain/inventory/po/entities/PurchaseOrderItem';

export interface PurchaseOrderItemRepository {
  findById(id: string): Promise<PurchaseOrderItem | null>;
  findByPurchaseOrderId(purchaseOrderId: string): Promise<PurchaseOrderItem[]>;
  create(item: PurchaseOrderItem): Promise<PurchaseOrderItem>;
  update(item: PurchaseOrderItem): Promise<PurchaseOrderItem>;
  delete(id: string): Promise<void>;
}
