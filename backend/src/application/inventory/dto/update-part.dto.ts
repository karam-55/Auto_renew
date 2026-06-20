export class UpdatePartDto {
  constructor(
    public readonly name?: string,
    public readonly nameAr?: string,
    public readonly nameEn?: string,
    public readonly description?: string,
    public readonly costSYP?: number,
    public readonly costUSD?: number,
    public readonly sellingPriceSYP?: number,
    public readonly sellingPriceUSD?: number,
    public readonly minQuantity?: number,
    public readonly location?: string,
    public readonly categoryId?: string,
    public readonly supplierId?: string
  ) {}

  static fromRequest(body: any): UpdatePartDto {
    return new UpdatePartDto(
      body.name,
      body.nameAr,
      body.nameEn,
      body.description,
      body.costSYP,
      body.costUSD,
      body.sellingPriceSYP,
      body.sellingPriceUSD,
      body.minQuantity,
      body.location,
      body.categoryId,
      body.supplierId
    );
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.costSYP !== undefined && this.costSYP < 0) {
      errors.push('Cost SYP must be positive');
    }

    if (this.sellingPriceSYP !== undefined && this.sellingPriceSYP < 0) {
      errors.push('Selling price SYP must be positive');
    }

    if (this.minQuantity !== undefined && this.minQuantity < 0) {
      errors.push('Min quantity must be non-negative');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
