import { RegisterSupplierPaymentUseCase } from '../use-cases/RegisterSupplierPaymentUseCase';
import { RegisterSupplierPaymentCommand } from '../commands/RegisterSupplierPaymentCommand';

export class RegisterSupplierPaymentHandler {
  constructor(private readonly registerSupplierPayment: RegisterSupplierPaymentUseCase) {}

  async handle(command: RegisterSupplierPaymentCommand) {
    return await this.registerSupplierPayment.execute(command);
  }
}
