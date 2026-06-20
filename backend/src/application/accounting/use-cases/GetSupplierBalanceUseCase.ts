import { ISupplierAccountRepository } from '../interfaces/ISupplierAccountRepository';
import { SupplierBalanceDTO } from '../dto/SupplierBalanceDTO';

export class GetSupplierBalanceUseCase {
  constructor(private readonly supplierAccountRepository: ISupplierAccountRepository) {}

  async execute(supplierId: string): Promise<SupplierBalanceDTO> {
    const balance = await this.supplierAccountRepository.getBalance(supplierId);
    return new SupplierBalanceDTO(supplierId, balance);
  }
}
