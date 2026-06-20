import { SubmitPurchaseOrder } from '../use-cases/SubmitPurchaseOrder';
import { SubmitPurchaseOrderCommand } from '../commands/SubmitPurchaseOrderCommand';

export class SubmitPurchaseOrderHandler {
  constructor(private readonly submitPurchaseOrder: SubmitPurchaseOrder) {}

  async handle(command: SubmitPurchaseOrderCommand) {
    return await this.submitPurchaseOrder.execute(command.purchaseOrderId);
  }
}
