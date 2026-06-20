export interface IBookingRepository {
  findById(id: string): Promise<any | null>;
}
