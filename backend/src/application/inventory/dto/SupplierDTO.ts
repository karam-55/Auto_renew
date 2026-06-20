export class SupplierDTO {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly phone: string,
    public readonly address?: string,
    public readonly email?: string,
    public readonly contactPerson?: string
  ) {}

  static fromEntity(supplier: any): SupplierDTO {
    return new SupplierDTO(
      supplier.id,
      supplier.name,
      supplier.phone,
      supplier.address,
      supplier.email,
      supplier.contactPerson
    );
  }
}
