import { PurchaseOrderRepository } from '../interfaces/PurchaseOrderRepository';
import { PurchaseOrderItemRepository } from '../interfaces/PurchaseOrderItemRepository';
import { PurchaseOrder } from '../../../domain/inventory/po/entities/PurchaseOrder';
import { PurchaseOrderItem } from '../../../domain/inventory/po/entities/PurchaseOrderItem';
import { UnitPrice } from '../../../domain/inventory/po/value-objects/UnitPrice';
import { v4 as uuidv4 } from 'uuid';

export class AddItemToPO {
  constructor(
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly purchaseOrderItemRepository: PurchaseOrderItemRepository
  ) {}

  async execute(
    purchaseOrderId: string,
    partId: string,
    description: string,
    quantity: number,
    unitPrice: number
  ): Promise<{ purchaseOrder: PurchaseOrder; item: PurchaseOrderItem }> {
    // Get the purchase order
    const purchaseOrder = await this.purchaseOrderRepository.findById(purchaseOrderId);
    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }

    if (!purchaseOrder.isDraft()) {
      throw new Error('Cannot add items to non-draft orders');
    }

    // Create purchase order item
    const itemId = uuidv4();
    const unitPriceVO = new UnitPrice(unitPrice);
    const item = PurchaseOrderItem.create(
      itemId,
      purchaseOrderId,
      partId,
      description,
      quantity,
      unitPriceVO
    );

    // Save item
    const createdItem = await this.purchaseOrderItemRepository.create(item);

    // Update purchase order total
    const newTotal = purchaseOrder.totalAmount + createdItem.total;
    const updatedPO = purchaseOrder.updateTotalAmount(newTotal);
    await this.purchaseOrderRepository.update(updatedPO);

    return { purchaseOrder: updatedPO, item: createdItem };
  }
}
