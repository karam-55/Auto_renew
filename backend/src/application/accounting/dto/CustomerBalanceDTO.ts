export class CustomerBalanceDTO {
  constructor(
    public readonly customerId: string,
    public readonly balance: number
  ) {}
}
