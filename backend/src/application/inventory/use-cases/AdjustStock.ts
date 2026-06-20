import { PartRepository } from '../interfaces/PartRepository';
import { InventoryAdjustmentRepository } from '../interfaces/InventoryAdjustmentRepository';
import { Part } from '../../../domain/inventory/entities/Part';
import { InventoryAdjustment } from '../../../domain/inventory/entities/InventoryAdjustment';
import { v4 as uuidv4 } from 'uuid';

export class AdjustStock {
  constructor(
    private readonly partRepository: PartRepository,
    private readonly inventoryAdjustmentRepository: InventoryAdjustmentRepository
  ) {}

  async execute(
    tenantId: string,
    partId: string,
    newQuantity: number,
    reason: string,
    warehouseId?: string,
    adjustedBy?: string
  ): Promise<{ part: Part; adjustment: InventoryAdjustment }> {
    // Get the part
    const part = await this.partRepository.findById(partId);
    if (!part) {
      throw new Error('Part not found');
    }

    const previousQuantity = part.quantity;

    // Update part quantity
    const updatedPart = part.updateQuantity(newQuantity);
    await this.partRepository.update(updatedPart);

    // Create inventory adjustment
    const adjustmentId = uuidv4();
    const adjustment = InventoryAdjustment.create(
      adjustmentId,
      tenantId,
      partId,
      previousQuantity,
      newQuantity,
      reason,
      warehouseId,
      adjustedBy
    );

    const createdAdjustment = await this.inventoryAdjustmentRepository.create(adjustment);

    return { part: updatedPart, adjustment: createdAdjustment };
  }
}
