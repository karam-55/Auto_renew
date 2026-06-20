import { LoginEmployeeDTO } from '../dto/LoginEmployeeDTO';

export class LoginEmployeeCommand {
  constructor(
    public readonly dto: LoginEmployeeDTO,
    public readonly ipAddress?: string,
    public readonly userAgent?: string
  ) {}
}
