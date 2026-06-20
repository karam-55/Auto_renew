export class InvoiceDTO {
  constructor(
    public readonly id: string,
    public readonly bookingId: string,
    public readonly customerId: string,
    public readonly vehicleId: string,
    public readonly items: any[],
    public readonly subtotal: number,
    public readonly tax: number,
    public readonly total: number,
    public readonly isFinalized: boolean,
    public readonly publicTrackingUrl: string
  ) {}

  static fromEntity(invoice: any): InvoiceDTO {
    return new InvoiceDTO(
      invoice.id,
      invoice.bookingId,
      invoice.customerId,
      invoice.vehicleId,
      invoice.items || [],
      invoice.subtotal,
      invoice.tax,
      invoice.total,
      invoice.isFinalized,
      invoice.publicTrackingUrl
    );
  }
}
