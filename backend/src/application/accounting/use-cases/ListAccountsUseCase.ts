import { IAccountRepository } from '../interfaces/IAccountRepository';
import { ListAccountsQuery } from '../queries/ListAccountsQuery';
import { AccountDTO } from '../dto/AccountDTO';

export class ListAccountsUseCase {
  constructor(private readonly accountRepository: IAccountRepository) {}

  async execute(query: ListAccountsQuery): Promise<AccountDTO[]> {
    const { tenantId } = query;

    const accounts = await this.accountRepository.list(tenantId);

    return accounts.map(account => AccountDTO.fromEntity(account));
  }
}
