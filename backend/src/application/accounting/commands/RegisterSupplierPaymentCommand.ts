import { RegisterSupplierPaymentDTO } from '../dto/RegisterSupplierPaymentDTO';

export class RegisterSupplierPaymentCommand {
  constructor(public readonly dto: RegisterSupplierPaymentDTO) {}
}
