import { PurchaseOrderRepository } from '../interfaces/PurchaseOrderRepository';
import { PurchaseOrderItemRepository } from '../interfaces/PurchaseOrderItemRepository';
import { PurchaseOrder } from '../../../domain/inventory/po/entities/PurchaseOrder';

export class RemoveItemFromPO {
  constructor(
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly purchaseOrderItemRepository: PurchaseOrderItemRepository
  ) {}

  async execute(itemId: string): Promise<{ purchaseOrder: PurchaseOrder }> {
    // Get the item
    const item = await this.purchaseOrderItemRepository.findById(itemId);
    if (!item) {
      throw new Error('Purchase order item not found');
    }

    // Get the purchase order
    const purchaseOrder = await this.purchaseOrderRepository.findById(item.purchaseOrderId);
    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }

    if (!purchaseOrder.isDraft()) {
      throw new Error('Cannot remove items from non-draft orders');
    }

    // Delete item
    await this.purchaseOrderItemRepository.delete(itemId);

    // Update purchase order total
    const newTotal = purchaseOrder.totalAmount - item.total;
    const updatedPO = purchaseOrder.updateTotalAmount(newTotal);
    await this.purchaseOrderRepository.update(updatedPO);

    return { purchaseOrder: updatedPO };
  }
}
