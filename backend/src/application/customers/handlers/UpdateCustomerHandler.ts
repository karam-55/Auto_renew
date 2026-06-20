import { UpdateCustomerUseCase } from '../use-cases/UpdateCustomerUseCase';
import { UpdateCustomerCommand } from '../commands/UpdateCustomerCommand';

export class UpdateCustomerHandler {
  constructor(private readonly updateCustomer: UpdateCustomerUseCase) {}

  async handle(command: UpdateCustomerCommand) {
    return await this.updateCustomer.execute(command);
  }
}
