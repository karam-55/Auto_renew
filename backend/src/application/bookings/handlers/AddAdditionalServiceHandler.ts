import { AddAdditionalServiceUseCase } from '../use-cases/AddAdditionalServiceUseCase';
import { AddAdditionalServiceCommand } from '../commands/AddAdditionalServiceCommand';

export class AddAdditionalServiceHandler {
  constructor(private readonly addAdditionalService: AddAdditionalServiceUseCase) {}

  async handle(command: AddAdditionalServiceCommand) {
    return await this.addAdditionalService.execute(command);
  }
}
