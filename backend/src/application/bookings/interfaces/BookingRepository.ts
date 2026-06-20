import { Booking } from '../../../domain/bookings/entities/Booking';
import { PublicToken } from '../../../domain/bookings/value-objects/PublicToken';
import { BookingStatus } from '../../../domain/bookings/entities/BookingStatus';

export interface BookingRepository {
  findById(id: string): Promise<Booking | null>;
  findByPublicToken(publicToken: PublicToken): Promise<Booking | null>;
  findByCustomerId(customerId: string): Promise<Booking[]>;
  findByVehicleId(vehicleId: string): Promise<Booking[]>;
  findByTenantId(tenantId: string): Promise<Booking[]>;
  findByStatus(tenantId: string, status: BookingStatus): Promise<Booking[]>;
  create(booking: Booking): Promise<Booking>;
  update(booking: Booking): Promise<Booking>;
  delete(id: string): Promise<void>;
}
