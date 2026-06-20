import { ICustomerAccountRepository } from '../interfaces/ICustomerAccountRepository';
import { CustomerStatementDTO } from '../dto/CustomerStatementDTO';

export class ListCustomerStatementsUseCase {
  constructor(private readonly customerAccountRepository: ICustomerAccountRepository) {}

  async execute(customerId: string): Promise<CustomerStatementDTO> {
    const entries = await this.customerAccountRepository.getStatement(customerId);
    return new CustomerStatementDTO(customerId, entries);
  }
}
