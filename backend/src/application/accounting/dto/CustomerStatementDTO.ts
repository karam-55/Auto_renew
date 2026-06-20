export class CustomerStatementDTO {
  constructor(
    public readonly customerId: string,
    public readonly entries: any[]
  ) {}
}
