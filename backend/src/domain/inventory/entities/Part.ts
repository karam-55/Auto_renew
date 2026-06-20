import { PartNumber } from '../value-objects/PartNumber';

export class Part {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly partNumber: PartNumber,
    public readonly name: string,
    public readonly costSYP: number,
    public readonly sellingPriceSYP: number,
    public readonly quantity: number,
    public readonly minQuantity: number,
    public readonly isActive: boolean,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly nameAr?: string,
    public readonly nameEn?: string,
    public readonly categoryId?: string,
    public readonly supplierId?: string,
    public readonly description?: string,
    public readonly costUSD?: number,
    public readonly sellingPriceUSD?: number,
    public readonly location?: string
  ) {}

  static create(
    id: string,
    tenantId: string,
    partNumber: PartNumber,
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
  ): Part {
    return new Part(
      id,
      tenantId,
      partNumber,
      name,
      costSYP,
      sellingPriceSYP,
      quantity || 0,
      minQuantity || 5,
      isActive !== undefined ? isActive : true,
      new Date(),
      new Date(),
      nameAr,
      nameEn,
      categoryId,
      supplierId,
      description,
      costUSD,
      sellingPriceUSD,
      location
    );
  }

  updateQuantity(newQuantity: number): Part {
    return new Part(
      this.id,
      this.tenantId,
      this.partNumber,
      this.name,
      this.costSYP,
      this.sellingPriceSYP,
      newQuantity,
      this.minQuantity,
      this.isActive,
      this.createdAt,
      new Date(),
      this.nameAr,
      this.nameEn,
      this.categoryId,
      this.supplierId,
      this.description,
      this.costUSD,
      this.sellingPriceUSD,
      this.location
    );
  }

  updateDetails(
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
  ): Part {
    return new Part(
      this.id,
      this.tenantId,
      this.partNumber,
      name || this.name,
      costSYP !== undefined ? costSYP : this.costSYP,
      sellingPriceSYP !== undefined ? sellingPriceSYP : this.sellingPriceSYP,
      this.quantity,
      minQuantity !== undefined ? minQuantity : this.minQuantity,
      this.isActive,
      this.createdAt,
      new Date(),
      nameAr !== undefined ? nameAr : this.nameAr,
      nameEn !== undefined ? nameEn : this.nameEn,
      categoryId !== undefined ? categoryId : this.categoryId,
      supplierId !== undefined ? supplierId : this.supplierId,
      description !== undefined ? description : this.description,
      costUSD !== undefined ? costUSD : this.costUSD,
      sellingPriceUSD !== undefined ? sellingPriceUSD : this.sellingPriceUSD,
      location !== undefined ? location : this.location
    );
  }

  activate(): Part {
    return new Part(
      this.id,
      this.tenantId,
      this.partNumber,
      this.name,
      this.costSYP,
      this.sellingPriceSYP,
      this.quantity,
      this.minQuantity,
      true,
      this.createdAt,
      new Date(),
      this.nameAr,
      this.nameEn,
      this.categoryId,
      this.supplierId,
      this.description,
      this.costUSD,
      this.sellingPriceUSD,
      this.location
    );
  }

  deactivate(): Part {
    return new Part(
      this.id,
      this.tenantId,
      this.partNumber,
      this.name,
      this.costSYP,
      this.sellingPriceSYP,
      this.quantity,
      this.minQuantity,
      false,
      this.createdAt,
      new Date(),
      this.nameAr,
      this.nameEn,
      this.categoryId,
      this.supplierId,
      this.description,
      this.costUSD,
      this.sellingPriceUSD,
      this.location
    );
  }

  isLowStock(): boolean {
    return this.quantity <= this.minQuantity;
  }

  isOutOfStock(): boolean {
    return this.quantity === 0;
  }
}
