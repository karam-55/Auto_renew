import { AddPOItemDto } from '../dto/add-po-item.dto';

export class AddPOItemCommand {
  constructor(public readonly dto: AddPOItemDto) {}
}
