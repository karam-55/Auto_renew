import { BookingRepository } from '../interfaces/BookingRepository';
import { Booking } from '../../../domain/bookings/entities/Booking';
import { BookingStatus } from '../../../domain/bookings/entities/BookingStatus';

export class ListBookings {
  constructor(private readonly bookingRepository: BookingRepository) {}

  async execute(tenantId: string): Promise<Booking[]> {
    return await this.bookingRepository.findByTenantId(tenantId);
  }

  async executeByCustomer(customerId: string): Promise<Booking[]> {
    return await this.bookingRepository.findByCustomerId(customerId);
  }

  async executeByVehicle(vehicleId: string): Promise<Booking[]> {
    return await this.bookingRepository.findByVehicleId(vehicleId);
  }

  async executeByStatus(tenantId: string, status: BookingStatus): Promise<Booking[]> {
    return await this.bookingRepository.findByStatus(tenantId, status);
  }
}
