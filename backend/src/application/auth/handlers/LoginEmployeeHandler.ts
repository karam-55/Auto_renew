import { LoginEmployee } from '../use-cases/LoginEmployee';
import { LoginEmployeeCommand } from '../commands/LoginEmployeeCommand';

export class LoginEmployeeHandler {
  constructor(private readonly loginEmployee: LoginEmployee) {}

  async handle(command: LoginEmployeeCommand) {
    return await this.loginEmployee.execute(command);
  }
}
