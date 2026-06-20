export class SupplierStatementDTO {
  constructor(
    public readonly supplierId: string,
    public readonly entries: any[]
  ) {}
}
