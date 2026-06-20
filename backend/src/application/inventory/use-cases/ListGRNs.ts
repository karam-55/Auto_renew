import { GRNRepository } from '../interfaces/GRNRepository';
import { GRN } from '../../../domain/inventory/grn/entities/GRN';

export class ListGRNs {
  constructor(private readonly grnRepository: GRNRepository) {}

  async execute(tenantId: string): Promise<GRN[]> {
    return await this.grnRepository.findByTenantId(tenantId);
  }

  async executeByPurchaseOrder(purchaseOrderId: string): Promise<GRN[]> {
    return await this.grnRepository.findByPurchaseOrderId(purchaseOrderId);
  }
}
