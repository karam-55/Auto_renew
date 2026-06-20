import { AddGRNItemDto } from '../dto/add-grn-item.dto';

export class AddGRNItemCommand {
  constructor(public readonly dto: AddGRNItemDto) {}
}
