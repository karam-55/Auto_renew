import { PartRepository } from '../interfaces/PartRepository';
import { Part } from '../../../domain/inventory/entities/Part';

export class ListParts {
  constructor(private readonly partRepository: PartRepository) {}

  async execute(tenantId: string): Promise<Part[]> {
    return await this.partRepository.findByTenantId(tenantId);
  }

  async executeByCategory(categoryId: string): Promise<Part[]> {
    return await this.partRepository.findByCategory(categoryId);
  }

  async executeBySupplier(supplierId: string): Promise<Part[]> {
    return await this.partRepository.findBySupplier(supplierId);
  }
}
