import { RegisterCustomerPaymentUseCase } from '../use-cases/RegisterCustomerPaymentUseCase';
import { RegisterCustomerPaymentCommand } from '../commands/RegisterCustomerPaymentCommand';

export class RegisterCustomerPaymentHandler {
  constructor(private readonly registerCustomerPayment: RegisterCustomerPaymentUseCase) {}

  async handle(command: RegisterCustomerPaymentCommand) {
    return await this.registerCustomerPayment.execute(command);
  }
}
