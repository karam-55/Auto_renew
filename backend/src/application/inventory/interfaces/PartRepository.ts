import { Part } from '../../../domain/inventory/entities/Part';
import { PartNumber } from '../../../domain/inventory/value-objects/PartNumber';

export interface PartRepository {
  findById(id: string): Promise<Part | null>;
  findByPartNumber(partNumber: PartNumber): Promise<Part | null>;
  findByTenantId(tenantId: string): Promise<Part[]>;
  findByCategory(categoryId: string): Promise<Part[]>;
  findBySupplier(supplierId: string): Promise<Part[]>;
  create(part: Part): Promise<Part>;
  update(part: Part): Promise<Part>;
  delete(id: string): Promise<void>;
}
