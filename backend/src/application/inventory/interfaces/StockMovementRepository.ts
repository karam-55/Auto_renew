import { StockMovement } from '../../../domain/inventory/entities/StockMovement';
import { MovementType } from '../../../domain/inventory/entities/StockMovement';

export interface StockMovementRepository {
  findById(id: string): Promise<StockMovement | null>;
  findByPartId(partId: string): Promise<StockMovement[]>;
  findByTenantId(tenantId: string): Promise<StockMovement[]>;
  findByType(tenantId: string, type: MovementType): Promise<StockMovement[]>;
  create(movement: StockMovement): Promise<StockMovement>;
  delete(id: string): Promise<void>;
}
