import { Part } from '../entities/Part';

export class PartCreatedEvent {
  constructor(
    public readonly part: Part,
    public readonly occurredAt: Date = new Date()
  ) {}

  getEventName(): string {
    return 'PartCreated';
  }

  getPayload(): any {
    return {
      partId: this.part.id,
      tenantId: this.part.tenantId,
      partNumber: this.part.partNumber.getValue(),
      name: this.part.name,
      nameAr: this.part.nameAr,
      nameEn: this.part.nameEn,
      categoryId: this.part.categoryId,
      supplierId: this.part.supplierId,
      costSYP: this.part.costSYP,
      costUSD: this.part.costUSD,
      sellingPriceSYP: this.part.sellingPriceSYP,
      sellingPriceUSD: this.part.sellingPriceUSD,
      quantity: this.part.quantity,
      minQuantity: this.part.minQuantity,
      location: this.part.location,
      isActive: this.part.isActive,
      occurredAt: this.occurredAt,
    };
  }
}
