export class CustomerDTO {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly phone: string,
    public readonly address: string,
    public readonly vehiclesCount: number
  ) {}

  static fromEntity(customer: any, vehiclesCount: number): CustomerDTO {
    return new CustomerDTO(
      customer.id,
      customer.name,
      customer.phone,
      customer.address,
      vehiclesCount
    );
  }
}
