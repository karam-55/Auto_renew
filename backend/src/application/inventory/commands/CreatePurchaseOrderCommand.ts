import { CreatePODto } from '../dto/create-po.dto';

export class CreatePurchaseOrderCommand {
  constructor(public readonly dto: CreatePODto) {}
}
