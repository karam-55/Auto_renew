import { PartRepository } from '../interfaces/PartRepository';
import { StockMovementRepository } from '../interfaces/StockMovementRepository';
import { IWorkOrderRepository } from '../interfaces/IWorkOrderRepository';
import { ConsumeStockForWorkOrderCommand } from '../commands/ConsumeStockForWorkOrderCommand';
import { Part } from '../../../domain/inventory/entities/Part';
import { StockMovement } from '../../../domain/inventory/entities/StockMovement';
import { MovementType } from '../../../domain/inventory/entities/StockMovement';
import { v4 as uuidv4 } from 'uuid';

export class ConsumeStockForWorkOrderUseCase {
  constructor(
    private readonly partRepository: PartRepository,
    private readonly stockMovementRepository: StockMovementRepository,
    private readonly workOrderRepository: IWorkOrderRepository
  ) {}

  async execute(command: ConsumeStockForWorkOrderCommand): Promise<{ consumedItems: any[] }> {
    const { dto } = command;

    // Validate DTO
    const validation = dto.validate();
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // Check if work order exists
    const workOrder = await this.workOrderRepository.findById(dto.workOrderId);
    if (!workOrder) {
      throw new Error('Work Order not found');
    }

    const consumedItems = [];

    // Process each item
    for (const item of dto.items) {
      // Get the part
      const part = await this.partRepository.findById(item.partId);
      if (!part) {
        throw new Error(`Part with ID ${item.partId} not found`);
      }

      // Check if there's enough stock
      if (part.quantity < item.quantity) {
        throw new Error(`Insufficient stock for part ${item.partId}. Available: ${part.quantity}, Required: ${item.quantity}`);
      }

      // Update part quantity
      const updatedPart = part.updateQuantity(part.quantity - item.quantity);
      await this.partRepository.update(updatedPart);

      // Create stock movement
      const movementId = uuidv4();
      const movement = StockMovement.create(
        movementId,
        workOrder.tenantId,
        item.partId,
        MovementType.OUT,
        item.quantity,
        item.costSYP,
        undefined,
        item.costUSD,
        `Consumed for Work Order ${dto.workOrderId}`
      );

      const createdMovement = await this.stockMovementRepository.create(movement);

      consumedItems.push({
        partId: item.partId,
        quantity: item.quantity,
        movementId: createdMovement.id,
      });
    }

    return { consumedItems };
  }
}
