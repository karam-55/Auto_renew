export class VehicleModel {
  constructor(
    public readonly id: string,
    public readonly brandId: string,
    public readonly name: string,
    public readonly nameAr?: string,
    public readonly nameEn?: string,
    public readonly year?: number,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static create(
    id: string,
    brandId: string,
    name: string,
    nameAr?: string,
    nameEn?: string,
    year?: number
  ): VehicleModel {
    return new VehicleModel(
      id,
      brandId,
      name,
      nameAr,
      nameEn,
      year,
      true,
      new Date(),
      new Date()
    );
  }

  deactivate(): VehicleModel {
    return new VehicleModel(
      this.id,
      this.brandId,
      this.name,
      this.nameAr,
      this.nameEn,
      this.year,
      false,
      this.createdAt,
      new Date()
    );
  }
}
