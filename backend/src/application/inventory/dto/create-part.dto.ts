export class CreatePartDto {
  constructor(
    public readonly tenantId: string,
    public readonly name: string,
    public readonly costSYP: number,
    public readonly sellingPriceSYP: number,
    public readonly nameAr?: string,
    public readonly nameEn?: string,
    public readonly categoryId?: string,
    public readonly supplierId?: string,
    public readonly description?: string,
    public readonly costUSD?: number,
    public readonly sellingPriceUSD?: number,
    public readonly quantity?: number,
    public readonly minQuantity?: number,
    public readonly location?: string,
    public readonly isActive?: boolean
  ) {}

  static fromRequest(body: any): CreatePartDto {
    return new CreatePartDto(
      body.tenantId,
      body.name,
      body.costSYP,
      body.sellingPriceSYP,
      body.nameAr,
      body.nameEn,
      body.categoryId,
      body.supplierId,
      body.description,
      body.costUSD,
      body.sellingPriceUSD,
      body.quantity,
      body.minQuantity,
      body.location,
      body.isActive
    );
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.tenantId) {
      errors.push('Tenant ID is required');
    }

    if (!this.name) {
      errors.push('Name is required');
    }

    if (!this.costSYP) {
      errors.push('Cost SYP is required');
    }

    if (this.costSYP < 0) {
      errors.push('Cost SYP must be positive');
    }

    if (!this.sellingPriceSYP) {
      errors.push('Selling price SYP is required');
    }

    if (this.sellingPriceSYP < 0) {
      errors.push('Selling price SYP must be positive');
    }

    if (this.quantity !== undefined && this.quantity < 0) {
      errors.push('Quantity must be non-negative');
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
