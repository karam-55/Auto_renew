export interface BookingTrackingRepository {
  findBookingByPublicToken(publicToken: string): Promise<any | null>;
}
