import { PurchaseOrderRepository } from '../interfaces/PurchaseOrderRepository';
import { PurchaseOrder } from '../../../domain/inventory/po/entities/PurchaseOrder';
import { OrderNumber } from '../../../domain/inventory/po/value-objects/OrderNumber';
import { SupplierId } from '../../../domain/inventory/po/value-objects/SupplierId';
import { PurchaseOrderCreatedEvent } from '../../../domain/inventory/po/events/PurchaseOrderCreatedEvent';
import { v4 as uuidv4 } from 'uuid';

export class CreatePurchaseOrder {
  constructor(private readonly purchaseOrderRepository: PurchaseOrderRepository) {}

  async execute(
    tenantId: string,
    supplierId: string,
    orderDate: Date,
    totalAmount: number,
    expectedDeliveryDate?: Date,
    notes?: string
  ): Promise<{ purchaseOrder: PurchaseOrder; event: PurchaseOrderCreatedEvent }> {
    // Generate order number
    const orderNumber = OrderNumber.generate();
    const supplierIdVO = new SupplierId(supplierId);

    // Create purchase order entity
    const purchaseOrderId = uuidv4();
    const purchaseOrder = PurchaseOrder.create(
      purchaseOrderId,
      tenantId,
      orderNumber,
      supplierIdVO,
      orderDate,
      totalAmount,
      expectedDeliveryDate,
      notes
    );

    // Save purchase order
    const createdPO = await this.purchaseOrderRepository.create(purchaseOrder);

    // Create event
    const event = new PurchaseOrderCreatedEvent(createdPO);

    return { purchaseOrder: createdPO, event };
  }
}
