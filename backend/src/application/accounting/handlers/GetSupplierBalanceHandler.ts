import { GetSupplierBalanceUseCase } from '../use-cases/GetSupplierBalanceUseCase';

export class GetSupplierBalanceHandler {
  constructor(private readonly getSupplierBalance: GetSupplierBalanceUseCase) {}

  async handle(supplierId: string) {
    return await this.getSupplierBalance.execute(supplierId);
  }
}
