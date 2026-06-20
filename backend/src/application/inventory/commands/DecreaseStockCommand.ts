import { DecreaseStockDto } from '../dto/decrease-stock.dto';

export class DecreaseStockCommand {
  constructor(public readonly dto: DecreaseStockDto) {}
}
