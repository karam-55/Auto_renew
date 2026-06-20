export class VehicleBrand {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly nameAr?: string,
    public readonly nameEn?: string,
    public readonly country?: string,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static create(
    id: string,
    name: string,
    nameAr?: string,
    nameEn?: string,
    country?: string
  ): VehicleBrand {
    return new VehicleBrand(
      id,
      name,
      nameAr,
      nameEn,
      country,
      true,
      new Date(),
      new Date()
    );
  }

  deactivate(): VehicleBrand {
    return new VehicleBrand(
      this.id,
      this.name,
      this.nameAr,
      this.nameEn,
      this.country,
      false,
      this.createdAt,
      new Date()
    );
  }
}
