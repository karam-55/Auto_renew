import { ICustomerAccountRepository } from '../interfaces/ICustomerAccountRepository';
import { CustomerBalanceDTO } from '../dto/CustomerBalanceDTO';

export class GetCustomerBalanceUseCase {
  constructor(private readonly customerAccountRepository: ICustomerAccountRepository) {}

  async execute(customerId: string): Promise<CustomerBalanceDTO> {
    const balance = await this.customerAccountRepository.getBalance(customerId);
    return new CustomerBalanceDTO(customerId, balance);
  }
}
