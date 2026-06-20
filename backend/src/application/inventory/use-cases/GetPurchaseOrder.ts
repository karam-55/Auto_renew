import { PurchaseOrderRepository } from '../interfaces/PurchaseOrderRepository';
import { PurchaseOrder } from '../../../domain/inventory/po/entities/PurchaseOrder';

export class GetPurchaseOrder {
  constructor(private readonly purchaseOrderRepository: PurchaseOrderRepository) {}

  async execute(purchaseOrderId: string): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrderRepository.findById(purchaseOrderId);

    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }

    return purchaseOrder;
  }
}
