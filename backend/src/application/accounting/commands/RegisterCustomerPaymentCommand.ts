import { RegisterCustomerPaymentDTO } from '../dto/RegisterCustomerPaymentDTO';

export class RegisterCustomerPaymentCommand {
  constructor(public readonly dto: RegisterCustomerPaymentDTO) {}
}
