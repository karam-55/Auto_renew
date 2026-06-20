import { GRNRepository } from '../interfaces/GRNRepository';
import { GRNItemRepository } from '../interfaces/GRNItemRepository';
import { PurchaseOrderItemRepository } from '../interfaces/PurchaseOrderItemRepository';
import { GRN } from '../../../domain/inventory/grn/entities/GRN';
import { GRNItem } from '../../../domain/inventory/grn/entities/GRNItem';
import { PurchaseOrderItem } from '../../../domain/inventory/po/entities/PurchaseOrderItem';
import { v4 as uuidv4 } from 'uuid';

export class AddGRNItem {
  constructor(
    private readonly grnRepository: GRNRepository,
    private readonly grnItemRepository: GRNItemRepository,
    private readonly purchaseOrderItemRepository: PurchaseOrderItemRepository
  ) {}

  async execute(
    grnId: string,
    purchaseOrderItemId: string,
    partId: string,
    description: string,
    orderedQuantity: number,
    receivedQuantity: number,
    unitPrice: number
  ): Promise<{ grn: GRN; item: GRNItem }> {
    // Get the GRN
    const grn = await this.grnRepository.findById(grnId);
    if (!grn) {
      throw new Error('GRN not found');
    }

    if (grn.isReceivedStatus()) {
      throw new Error('Cannot add items to received GRN');
    }

    // Get the purchase order item to get ordered quantity
    const poItem = await this.purchaseOrderItemRepository.findById(purchaseOrderItemId);
    if (!poItem) {
      throw new Error('Purchase order item not found');
    }

    // Validate received quantity doesn't exceed ordered quantity
    if (receivedQuantity > poItem.quantity) {
      throw new Error('Received quantity cannot exceed ordered quantity');
    }

    // Create GRN item
    const itemId = uuidv4();
    const item = GRNItem.create(
      itemId,
      grnId,
      purchaseOrderItemId,
      partId,
      description,
      orderedQuantity,
      receivedQuantity,
      unitPrice
    );

    // Save item
    const createdItem = await this.grnItemRepository.create(item);

    return { grn, item: createdItem };
  }
}
