import { PurchaseOrder } from '../../../domain/inventory/po/entities/PurchaseOrder';

export interface PurchaseOrderRepository {
  findById(id: string): Promise<PurchaseOrder | null>;
  findByOrderNumber(orderNumber: string): Promise<PurchaseOrder | null>;
  findByTenantId(tenantId: string): Promise<PurchaseOrder[]>;
  findBySupplierId(supplierId: string): Promise<PurchaseOrder[]>;
  create(purchaseOrder: PurchaseOrder): Promise<PurchaseOrder>;
  update(purchaseOrder: PurchaseOrder): Promise<PurchaseOrder>;
  delete(id: string): Promise<void>;
}
