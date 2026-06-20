import { ListSuppliersUseCase } from '../use-cases/ListSuppliersUseCase';
import { ListSuppliersQuery } from '../queries/ListSuppliersQuery';

export class ListSuppliersHandler {
  constructor(private readonly listSuppliers: ListSuppliersUseCase) {}

  async handle(query: ListSuppliersQuery) {
    return await this.listSuppliers.execute(query);
  }
}
