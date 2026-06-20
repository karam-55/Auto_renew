import { ISupplierAccountRepository } from '../interfaces/ISupplierAccountRepository';
import { SupplierStatementDTO } from '../dto/SupplierStatementDTO';

export class ListSupplierStatementsUseCase {
  constructor(private readonly supplierAccountRepository: ISupplierAccountRepository) {}

  async execute(supplierId: string): Promise<SupplierStatementDTO> {
    const entries = await this.supplierAccountRepository.getStatement(supplierId);
    return new SupplierStatementDTO(supplierId, entries);
  }
}
