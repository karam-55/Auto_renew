import { PurchaseOrderRepository } from '../interfaces/PurchaseOrderRepository';
import { PurchaseOrder } from '../../../domain/inventory/po/entities/PurchaseOrder';

export class CancelPurchaseOrder {
  constructor(private readonly purchaseOrderRepository: PurchaseOrderRepository) {}

  async execute(purchaseOrderId: string): Promise<PurchaseOrder> {
    // Get the purchase order
    const purchaseOrder = await this.purchaseOrderRepository.findById(purchaseOrderId);
    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }

    // Cancel the order
    const cancelledPO = purchaseOrder.cancel();
    await this.purchaseOrderRepository.update(cancelledPO);

    return cancelledPO;
  }
}
