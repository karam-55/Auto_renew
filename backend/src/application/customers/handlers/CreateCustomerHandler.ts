import { CreateCustomerUseCase } from '../use-cases/CreateCustomerUseCase';
import { CreateCustomerCommand } from '../commands/CreateCustomerCommand';

export class CreateCustomerHandler {
  constructor(private readonly createCustomer: CreateCustomerUseCase) {}

  async handle(command: CreateCustomerCommand) {
    return await this.createCustomer.execute(command);
  }
}
