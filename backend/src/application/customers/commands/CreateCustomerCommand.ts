import { CreateCustomerDto } from '../dto/CreateCustomerDto';

export class CreateCustomerCommand {
  constructor(public readonly dto: CreateCustomerDto) {}
}
