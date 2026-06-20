import { UpdatePartDto } from '../dto/update-part.dto';

export class UpdateStockItemCommand {
  constructor(
    public readonly stockItemId: string,
    public readonly dto: UpdatePartDto
  ) {}
}
