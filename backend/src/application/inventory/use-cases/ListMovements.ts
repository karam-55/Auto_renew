import { StockMovementRepository } from '../interfaces/StockMovementRepository';
import { StockMovement } from '../../../domain/inventory/entities/StockMovement';
import { MovementType } from '../../../domain/inventory/entities/StockMovement';

export class ListMovements {
  constructor(private readonly stockMovementRepository: StockMovementRepository) {}

  async execute(tenantId: string): Promise<StockMovement[]> {
    return await this.stockMovementRepository.findByTenantId(tenantId);
  }

  async executeByPart(partId: string): Promise<StockMovement[]> {
    return await this.stockMovementRepository.findByPartId(partId);
  }

  async executeByType(tenantId: string, type: MovementType): Promise<StockMovement[]> {
    return await this.stockMovementRepository.findByType(tenantId, type);
  }
}
