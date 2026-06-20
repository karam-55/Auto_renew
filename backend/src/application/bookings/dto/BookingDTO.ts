export class BookingDTO {
  constructor(
    public readonly id: string,
    public readonly customerId: string,
    public readonly vehicleId: string,
    public readonly status: string,
    public readonly requestedServices: any[],
    public readonly additionalServices: any[],
    public readonly publicTrackingId: string,
    public readonly publicTrackingUrl: string,
    public readonly workOrderId?: string,
    public readonly invoiceId?: string
  ) {}

  static fromEntity(booking: any): BookingDTO {
    return new BookingDTO(
      booking.id,
      booking.customerId,
      booking.vehicleId,
      booking.status,
      booking.requestedServices || [],
      booking.additionalServices || [],
      booking.publicTrackingId,
      booking.publicTrackingUrl,
      booking.workOrderId,
      booking.invoiceId
    );
  }
}
