import { ListInvoicesUseCase } from '../use-cases/ListInvoicesUseCase';
import { ListInvoicesQuery } from '../queries/ListInvoicesQuery';

export class ListInvoicesHandler {
  constructor(private readonly listInvoices: ListInvoicesUseCase) {}

  async handle(query: ListInvoicesQuery) {
    return await this.listInvoices.execute(query);
  }
}
