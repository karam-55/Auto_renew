import { AdjustStockDto } from '../dto/adjust-stock.dto';

export class AdjustStockCommand {
  constructor(public readonly dto: AdjustStockDto) {}
}
