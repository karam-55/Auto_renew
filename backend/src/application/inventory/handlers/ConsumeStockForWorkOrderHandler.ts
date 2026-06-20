import { ConsumeStockForWorkOrderUseCase } from '../use-cases/ConsumeStockForWorkOrderUseCase';
import { ConsumeStockForWorkOrderCommand } from '../commands/ConsumeStockForWorkOrderCommand';

export class ConsumeStockForWorkOrderHandler {
  constructor(private readonly consumeStockForWorkOrder: ConsumeStockForWorkOrderUseCase) {}

  async handle(command: ConsumeStockForWorkOrderCommand) {
    return await this.consumeStockForWorkOrder.execute(command);
  }
}
