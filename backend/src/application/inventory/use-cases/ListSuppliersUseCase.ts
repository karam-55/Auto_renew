import { ISupplierRepository } from '../interfaces/ISupplierRepository';
import { ListSuppliersQuery } from '../queries/ListSuppliersQuery';
import { SupplierDTO } from '../dto/SupplierDTO';

export class ListSuppliersUseCase {
  constructor(private readonly supplierRepository: ISupplierRepository) {}

  async execute(query: ListSuppliersQuery): Promise<SupplierDTO[]> {
    const { tenantId } = query;

    const suppliers = await this.supplierRepository.list(tenantId);

    return suppliers.map(supplier => SupplierDTO.fromEntity(supplier));
  }
}
