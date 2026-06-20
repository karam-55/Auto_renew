import { PurchaseOrderRepository } from '../interfaces/PurchaseOrderRepository';
import { PurchaseOrderItemRepository } from '../interfaces/PurchaseOrderItemRepository';
import { PurchaseOrder } from '../../../domain/inventory/po/entities/PurchaseOrder';
import { PurchaseOrderSubmittedEvent } from '../../../domain/inventory/po/events/PurchaseOrderSubmittedEvent';

export class SubmitPurchaseOrder {
  constructor(
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly purchaseOrderItemRepository: PurchaseOrderItemRepository
  ) {}

  async execute(purchaseOrderId: string): Promise<{ purchaseOrder: PurchaseOrder; event: PurchaseOrderSubmittedEvent }> {
    // Get the purchase order
    const purchaseOrder = await this.purchaseOrderRepository.findById(purchaseOrderId);
    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }

    // Check if PO has items
    const items = await this.purchaseOrderItemRepository.findByPurchaseOrderId(purchaseOrderId);
    if (items.length === 0) {
      throw new Error('Cannot submit purchase order without items');
    }

    // Submit the order
    const submittedPO = purchaseOrder.submit();
    await this.purchaseOrderRepository.update(submittedPO);

    // Create event
    const event = new PurchaseOrderSubmittedEvent(submittedPO);

    return { purchaseOrder: submittedPO, event };
  }
}
