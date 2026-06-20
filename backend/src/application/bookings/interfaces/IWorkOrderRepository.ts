export interface IWorkOrderRepository {
  createForBooking(bookingId: string): Promise<any>;
}
