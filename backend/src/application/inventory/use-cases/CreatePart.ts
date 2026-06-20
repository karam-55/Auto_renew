import { PartRepository } from '../interfaces/PartRepository';
import { Part } from '../../../domain/inventory/entities/Part';
import { PartNumber } from '../../../domain/inventory/value-objects/PartNumber';
import { PartCreatedEvent } from '../../../domain/inventory/events/PartCreatedEvent';
import { v4 as uuidv4 } from 'uuid';

export class CreatePart {
  constructor(private readonly partRepository: PartRepository) {}

  async execute(
    tenantId: string,
    name: string,
    costSYP: number,
    sellingPriceSYP: number,
    nameAr?: string,
    nameEn?: string,
    categoryId?: string,
    supplierId?: string,
    description?: string,
    costUSD?: number,
    sellingPriceUSD?: number,
    quantity?: number,
    minQuantity?: number,
    location?: string,
    isActive?: boolean
  ): Promise<{ part: Part; event: PartCreatedEvent }> {
    // Generate part number
    const partNumber = PartNumber.generate();

    // Create part entity
    const partId = uuidv4();
    const part = Part.create(
      partId,
      tenantId,
      partNumber,
      name,
      costSYP,
      sellingPriceSYP,
      nameAr,
      nameEn,
      categoryId,
      supplierId,
      description,
      costUSD,
      sellingPriceUSD,
      quantity,
      minQuantity,
      location,
      isActive
    );

    // Save part
    const createdPart = await this.partRepository.create(part);

    // Create event
    const event = new PartCreatedEvent(createdPart);

    return { part: createdPart, event };
  }
}
