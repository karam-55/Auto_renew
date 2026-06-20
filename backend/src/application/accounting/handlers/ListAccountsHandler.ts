import { ListAccountsUseCase } from '../use-cases/ListAccountsUseCase';
import { ListAccountsQuery } from '../queries/ListAccountsQuery';

export class ListAccountsHandler {
  constructor(private readonly listAccounts: ListAccountsUseCase) {}

  async handle(query: ListAccountsQuery) {
    return await this.listAccounts.execute(query);
  }
}
