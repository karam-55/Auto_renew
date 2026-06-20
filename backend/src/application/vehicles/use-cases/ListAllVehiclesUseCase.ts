import { IVehicleRepository } from '../interfaces/IVehicleRepository';
import { IBookingRepository } from '../interfaces/IBookingRepository';
import { ListAllVehiclesQuery } from '../queries/ListAllVehiclesQuery';
import { VehicleDTO } from '../dto/VehicleDTO';

export class ListAllVehiclesUseCase {
  constructor(
    private readonly vehicleRepository: IVehicleRepository,
    private readonly bookingRepository: IBookingRepository
  ) {}

  async execute(query: ListAllVehiclesQuery): Promise<VehicleDTO[]> {
    const { tenantId } = query;

    const vehicles = await this.vehicleRepository.listAll(tenantId);

    const vehicleDTOs = await Promise.all(
      vehicles.map(async (vehicle) => {
        const bookingsCount = await this.bookingRepository.countByVehicleId(vehicle.id);
        return VehicleDTO.fromEntity(vehicle, bookingsCount);
      })
    );

    return vehicleDTOs;
  }
}
