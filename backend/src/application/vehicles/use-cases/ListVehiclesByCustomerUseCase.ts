import { IVehicleRepository } from '../interfaces/IVehicleRepository';
import { IBookingRepository } from '../interfaces/IBookingRepository';
import { ListVehiclesByCustomerQuery } from '../queries/ListVehiclesByCustomerQuery';
import { VehicleDTO } from '../dto/VehicleDTO';

export class ListVehiclesByCustomerUseCase {
  constructor(
    private readonly vehicleRepository: IVehicleRepository,
    private readonly bookingRepository: IBookingRepository
  ) {}

  async execute(query: ListVehiclesByCustomerQuery): Promise<VehicleDTO[]> {
    const { customerId } = query;

    const vehicles = await this.vehicleRepository.listByCustomer(customerId);

    const vehicleDTOs = await Promise.all(
      vehicles.map(async (vehicle) => {
        const bookingsCount = await this.bookingRepository.countByVehicleId(vehicle.id);
        return VehicleDTO.fromEntity(vehicle, bookingsCount);
      })
    );

    return vehicleDTOs;
  }
}
