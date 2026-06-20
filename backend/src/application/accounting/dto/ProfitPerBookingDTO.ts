export class ProfitPerBookingDTO {
  constructor(
    public readonly bookingId: string,
    public readonly revenue: number,
    public readonly cost: number,
    public readonly profit: number
  ) {}
}
