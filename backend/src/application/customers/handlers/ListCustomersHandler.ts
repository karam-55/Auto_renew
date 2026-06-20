import { ListCustomersUseCase } from '../use-cases/ListCustomersUseCase';
import { ListCustomersQuery } from '../queries/ListCustomersQuery';

export class ListCustomersHandler {
  constructor(private readonly listCustomers: ListCustomersUseCase) {}

  async handle(query: ListCustomersQuery) {
    return await this.listCustomers.execute(query);
  }
}
