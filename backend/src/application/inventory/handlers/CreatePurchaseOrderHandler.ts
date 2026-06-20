import { CreatePurchaseOrder } from '../use-cases/CreatePurchaseOrder';
import { CreatePurchaseOrderCommand } from '../commands/CreatePurchaseOrderCommand';

export class CreatePurchaseOrderHandler {
  constructor(private readonly createPurchaseOrder: CreatePurchaseOrder) {}

  async handle(command: CreatePurchaseOrderCommand) {
    const { dto } = command;
    return await this.createPurchaseOrder.execute(
      dto.tenantId,
      dto.supplierId,
      dto.orderDate,
      dto.totalAmount,
      dto.expectedDeliveryDate,
      dto.notes
    );
  }
}
