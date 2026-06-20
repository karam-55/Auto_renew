import { GRNRepository } from '../../../application/inventory/interfaces/GRNRepository';
import { GRN } from '../../../domain/inventory/grn/entities/GRN';

export class MockGRNRepository implements GRNRepository {
  private grns: Map<string, GRN> = new Map();

  async findById(id: string): Promise<GRN | null> {
    return this.grns.get(id) || null;
  }

  async findByGRNNumber(grnNumber: string): Promise<GRN | null> {
    for (const grn of this.grns.values()) {
      if (grn.grnNumber.getValue() === grnNumber) {
        return grn;
      }
    }
    return null;
  }

  async findByTenantId(tenantId: string): Promise<GRN[]> {
    return Array.from(this.grns.values()).filter(
      grn => grn.tenantId === tenantId
    );
  }

  async findByPurchaseOrderId(purchaseOrderId: string): Promise<GRN[]> {
    return Array.from(this.grns.values()).filter(
      grn => grn.purchaseOrderId === purchaseOrderId
    );
  }

  async create(grn: GRN): Promise<GRN> {
    this.grns.set(grn.id, grn);
    return grn;
  }

  async update(grn: GRN): Promise<GRN> {
    this.grns.set(grn.id, grn);
    return grn;
  }

  async delete(id: string): Promise<void> {
    this.grns.delete(id);
  }
}
