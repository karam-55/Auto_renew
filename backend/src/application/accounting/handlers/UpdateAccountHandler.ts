import { UpdateAccountUseCase } from '../use-cases/UpdateAccountUseCase';
import { UpdateAccountCommand } from '../commands/UpdateAccountCommand';

export class UpdateAccountHandler {
  constructor(private readonly updateAccount: UpdateAccountUseCase) {}

  async handle(command: UpdateAccountCommand) {
    return await this.updateAccount.execute(command);
  }
}
