import { AddRequestedServiceUseCase } from '../use-cases/AddRequestedServiceUseCase';
import { AddRequestedServiceCommand } from '../commands/AddRequestedServiceCommand';

export class AddRequestedServiceHandler {
  constructor(private readonly addRequestedService: AddRequestedServiceUseCase) {}

  async handle(command: AddRequestedServiceCommand) {
    return await this.addRequestedService.execute(command);
  }
}
