import { PurchaseOrderRepository } from '../interfaces/PurchaseOrderRepository';
import { PurchaseOrder } from '../../../domain/inventory/po/entities/PurchaseOrder';

export class ListPurchaseOrders {
  constructor(private readonly purchaseOrderRepository: PurchaseOrderRepository) {}

  async execute(tenantId: string): Promise<PurchaseOrder[]> {
    return await this.purchaseOrderRepository.findByTenantId(tenantId);
  }

  async executeBySupplier(supplierId: string): Promise<PurchaseOrder[]> {
    return await this.purchaseOrderRepository.findBySupplierId(supplierId);
  }
}
