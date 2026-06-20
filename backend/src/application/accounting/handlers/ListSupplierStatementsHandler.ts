import { ListSupplierStatementsUseCase } from '../use-cases/ListSupplierStatementsUseCase';

export class ListSupplierStatementsHandler {
  constructor(private readonly listSupplierStatements: ListSupplierStatementsUseCase) {}

  async handle(supplierId: string) {
    return await this.listSupplierStatements.execute(supplierId);
  }
}
