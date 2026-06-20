import { ConsumeStockForWorkOrderDTO } from '../dto/ConsumeStockForWorkOrderDTO';

export class ConsumeStockForWorkOrderCommand {
  constructor(public readonly dto: ConsumeStockForWorkOrderDTO) {}
}
