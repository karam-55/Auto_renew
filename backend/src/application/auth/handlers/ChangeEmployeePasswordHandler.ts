import { ChangeEmployeePassword } from '../use-cases/ChangeEmployeePassword';
import { ChangeEmployeePasswordCommand } from '../commands/ChangeEmployeePasswordCommand';

export class ChangeEmployeePasswordHandler {
  constructor(private readonly changeEmployeePassword: ChangeEmployeePassword) {}

  async handle(command: ChangeEmployeePasswordCommand) {
    return await this.changeEmployeePassword.execute(command);
  }
}
