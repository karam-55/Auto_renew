import { PartRepository } from '../interfaces/PartRepository';
import { Part } from '../../../domain/inventory/entities/Part';

export class UpdatePart {
  constructor(private readonly partRepository: PartRepository) {}

  async execute(
    partId: string,
    name?: string,
    nameAr?: string,
    nameEn?: string,
    description?: string,
    costSYP?: number,
    costUSD?: number,
    sellingPriceSYP?: number,
    sellingPriceUSD?: number,
    minQuantity?: number,
    location?: string,
    categoryId?: string,
    supplierId?: string
  ): Promise<Part> {
    const part = await this.partRepository.findById(partId);

    if (!part) {
      throw new Error('Part not found');
    }

    const updatedPart = part.updateDetails(
      name,
      nameAr,
      nameEn,
      description,
      costSYP,
      costUSD,
      sellingPriceSYP,
      sellingPriceUSD,
      minQuantity,
      location,
      categoryId,
      supplierId
    );

    return await this.partRepository.update(updatedPart);
  }
}
