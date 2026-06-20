import { GetCustomerBalanceUseCase } from '../use-cases/GetCustomerBalanceUseCase';

export class GetCustomerBalanceHandler {
  constructor(private readonly getCustomerBalance: GetCustomerBalanceUseCase) {}

  async handle(customerId: string) {
    return await this.getCustomerBalance.execute(customerId);
  }
}
