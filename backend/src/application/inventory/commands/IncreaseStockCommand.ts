import { IncreaseStockDto } from '../dto/increase-stock.dto';

export class IncreaseStockCommand {
  constructor(public readonly dto: IncreaseStockDto) {}
}
