export class SalesByServiceDTO {
  constructor(
    public readonly serviceId: string,
    public readonly totalAmount: number
  ) {}
}
