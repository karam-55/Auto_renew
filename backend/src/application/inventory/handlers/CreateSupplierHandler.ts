import { CreateSupplierUseCase } from '../use-cases/CreateSupplierUseCase';
import { CreateSupplierCommand } from '../commands/CreateSupplierCommand';

export class CreateSupplierHandler {
  constructor(private readonly createSupplier: CreateSupplierUseCase) {}

  async handle(command: CreateSupplierCommand) {
    return await this.createSupplier.execute(command);
  }
}
