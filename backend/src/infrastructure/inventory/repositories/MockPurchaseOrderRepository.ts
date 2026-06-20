import { PurchaseOrderRepository } from '../../../application/inventory/interfaces/PurchaseOrderRepository';
import { PurchaseOrder } from '../../../domain/inventory/po/entities/PurchaseOrder';

export class MockPurchaseOrderRepository implements PurchaseOrderRepository {
  private orders: Map<string, PurchaseOrder> = new Map();

  async findById(id: string): Promise<PurchaseOrder | null> {
    return this.orders.get(id) || null;
  }

  async findByOrderNumber(orderNumber: string): Promise<PurchaseOrder | null> {
    for (const order of this.orders.values()) {
      if (order.orderNumber.getValue() === orderNumber) {
        return order;
      }
    }
    return null;
  }

  async findByTenantId(tenantId: string): Promise<PurchaseOrder[]> {
    return Array.from(this.orders.values()).filter(
      order => order.tenantId === tenantId
    );
  }

  async findBySupplierId(supplierId: string): Promise<PurchaseOrder[]> {
    return Array.from(this.orders.values()).filter(
      order => order.supplierId.getValue() === supplierId
    );
  }

  async create(purchaseOrder: PurchaseOrder): Promise<PurchaseOrder> {
    this.orders.set(purchaseOrder.id, purchaseOrder);
    return purchaseOrder;
  }

  async update(purchaseOrder: PurchaseOrder): Promise<PurchaseOrder> {
    this.orders.set(purchaseOrder.id, purchaseOrder);
    return purchaseOrder;
  }

  async delete(id: string): Promise<void> {
    this.orders.delete(id);
  }
}
