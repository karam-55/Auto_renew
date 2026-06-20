import { GRN } from '../../../domain/inventory/grn/entities/GRN';

export interface GRNRepository {
  findById(id: string): Promise<GRN | null>;
  findByGRNNumber(grnNumber: string): Promise<GRN | null>;
  findByTenantId(tenantId: string): Promise<GRN[]>;
  findByPurchaseOrderId(purchaseOrderId: string): Promise<GRN[]>;
  create(grn: GRN): Promise<GRN>;
  update(grn: GRN): Promise<GRN>;
  delete(id: string): Promise<void>;
}
