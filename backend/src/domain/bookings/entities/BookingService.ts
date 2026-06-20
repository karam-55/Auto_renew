export class BookingService {
  constructor(
    public readonly id: string,
    public readonly bookingId: string,
    public readonly serviceId: string,
    public readonly priceSYP: number,
    public readonly priceUSD?: number,
    public readonly notes?: string,
    public readonly createdAt: Date = new Date()
  ) {}

  static create(
    id: string,
    bookingId: string,
    serviceId: string,
    priceSYP: number,
    priceUSD?: number,
    notes?: string
  ): BookingService {
    return new BookingService(
      id,
      bookingId,
      serviceId,
      priceSYP,
      priceUSD,
      notes,
      new Date()
    );
  }

  updatePrice(priceSYP: number, priceUSD?: number): BookingService {
    return new BookingService(
      this.id,
      this.bookingId,
      this.serviceId,
      priceSYP,
      priceUSD,
      this.notes,
      this.createdAt
    );
  }

  updateNotes(notes?: string): BookingService {
    return new BookingService(
      this.id,
      this.bookingId,
      this.serviceId,
      this.priceSYP,
      this.priceUSD,
      notes,
      this.createdAt
    );
  }
}
