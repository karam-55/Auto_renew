import { CreateGRNDto } from '../dto/create-grn.dto';

export class CreateGRNCommand {
  constructor(public readonly dto: CreateGRNDto) {}
}
