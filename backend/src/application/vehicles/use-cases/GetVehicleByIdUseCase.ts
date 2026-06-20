import { IVehicleRepository } from '../interfaces/IVehicleRepository';
import { IBookingRepository } from '../interfaces/IBookingRepository';
import { GetVehicleByIdQuery } from '../queries/GetVehicleByIdQuery';
import { VehicleDTO } from '../dto/VehicleDTO';

export class GetVehicleByIdUseCase {
  constructor(
    private readonly vehicleRepository: IVehicleRepository,
    private readonly bookingRepository: IBookingRepository
  ) {}

  async execute(query: GetVehicleByIdQuery): Promise<VehicleDTO> {
    const { vehicleId } = query;

    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    const bookingsCount = await this.bookingRepository.countByVehicleId(vehicleId);

    return VehicleDTO.fromEntity(vehicle, bookingsCount);
  }
}
