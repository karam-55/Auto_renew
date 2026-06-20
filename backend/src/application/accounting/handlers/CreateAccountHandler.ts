import { CreateAccountUseCase } from '../use-cases/CreateAccountUseCase';
import { CreateAccountCommand } from '../commands/CreateAccountCommand';

export class CreateAccountHandler {
  constructor(private readonly createAccount: CreateAccountUseCase) {}

  async handle(command: CreateAccountCommand) {
    return await this.createAccount.execute(command);
  }
}
