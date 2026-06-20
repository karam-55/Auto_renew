import { InventoryAdjustment } from '../../../domain/inventory/entities/InventoryAdjustment';

export interface InventoryAdjustmentRepository {
  findById(id: string): Promise<InventoryAdjustment | null>;
  findByPartId(partId: string): Promise<InventoryAdjustment[]>;
  findByTenantId(tenantId: string): Promise<InventoryAdjustment[]>;
  create(adjustment: InventoryAdjustment): Promise<InventoryAdjustment>;
  delete(id: string): Promise<void>;
}
