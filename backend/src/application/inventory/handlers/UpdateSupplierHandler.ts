import { UpdateSupplierUseCase } from '../use-cases/UpdateSupplierUseCase';
import { UpdateSupplierCommand } from '../commands/UpdateSupplierCommand';

export class UpdateSupplierHandler {
  constructor(private readonly updateSupplier: UpdateSupplierUseCase) {}

  async handle(command: UpdateSupplierCommand) {
    return await this.updateSupplier.execute(command);
  }
}
