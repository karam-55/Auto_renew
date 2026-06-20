import { UpdateCustomerDto } from '../dto/UpdateCustomerDto';

export class UpdateCustomerCommand {
  constructor(
    public readonly customerId: string,
    public readonly dto: UpdateCustomerDto
  ) {}
}
