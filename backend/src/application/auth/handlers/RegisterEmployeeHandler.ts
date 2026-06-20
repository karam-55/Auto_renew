import { RegisterEmployee } from '../use-cases/RegisterEmployee';
import { RegisterEmployeeCommand } from '../commands/RegisterEmployeeCommand';

export class RegisterEmployeeHandler {
  constructor(private readonly registerEmployee: RegisterEmployee) {}

  async handle(command: RegisterEmployeeCommand) {
    return await this.registerEmployee.execute(command);
  }
}
