import { CancelPurchaseOrder } from '../use-cases/CancelPurchaseOrder';
import { ClosePurchaseOrderCommand } from '../commands/ClosePurchaseOrderCommand';

export class ClosePurchaseOrderHandler {
  constructor(private readonly cancelPurchaseOrder: CancelPurchaseOrder) {}

  async handle(command: ClosePurchaseOrderCommand) {
    return await this.cancelPurchaseOrder.execute(command.purchaseOrderId);
  }
}
