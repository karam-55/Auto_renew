import { CreatePartDto } from '../dto/create-part.dto';

export class CreateStockItemCommand {
  constructor(public readonly dto: CreatePartDto) {}
}
