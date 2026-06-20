import { RegisterEmployeeDTO } from '../dto/RegisterEmployeeDTO';

export class RegisterEmployeeCommand {
  constructor(public readonly dto: RegisterEmployeeDTO) {}
}
