import { IVehicleRepository } from '../interfaces/IVehicleRepository';
import { IBookingRepository } from '../interfaces/IBookingRepository';
import { UpdateVehicleCommand } from '../commands/UpdateVehicleCommand';
import { VehicleDTO } from '../dto/VehicleDTO';

export class UpdateVehicleUseCase {
  constructor(
    private readonly vehicleRepository: IVehicleRepository,
    private readonly bookingRepository: IBookingRepository
  ) {}

  async execute(command: UpdateVehicleCommand): Promise<VehicleDTO> {
    const { vehicleId, dto } = command;

    // Validate DTO
    const validation = dto.validate();
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // Find vehicle
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    // Check for duplicate plate number (if plate is being changed)
    if (dto.licensePlate && vehicle.licensePlate !== dto.licensePlate) {
      const existingVehicle = await this.vehicleRepository.findByPlate(dto.licensePlate, vehicle.tenantId);
      if (existingVehicle && existingVehicle.id !== vehicleId) {
        throw new Error('Vehicle with this plate number already exists');
      }
    }

    // Update vehicle
    const updatedVehicle = {
      ...vehicle,
      make: dto.make || vehicle.make,
      model: dto.model || vehicle.model,
      year: dto.year || vehicle.year,
      licensePlate: dto.licensePlate || vehicle.licensePlate,
      vin: dto.vin !== undefined ? dto.vin : vehicle.vin,
      color: dto.color !== undefined ? dto.color : vehicle.color,
      notes: dto.notes !== undefined ? dto.notes : vehicle.notes,
      updatedAt: new Date(),
    };

    // Save vehicle
    const savedVehicle = await this.vehicleRepository.update(updatedVehicle);

    // Get bookings count
    const bookingsCount = await this.bookingRepository.countByVehicleId(vehicleId);

    return VehicleDTO.fromEntity(savedVehicle, bookingsCount);
  }
}
