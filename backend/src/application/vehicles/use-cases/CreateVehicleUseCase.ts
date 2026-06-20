import { IVehicleRepository } from '../interfaces/IVehicleRepository';
import { ICustomerRepository } from '../interfaces/ICustomerRepository';
import { CreateVehicleCommand } from '../commands/CreateVehicleCommand';
import { VehicleDTO } from '../dto/VehicleDTO';
import { v4 as uuidv4 } from 'uuid';

export class CreateVehicleUseCase {
  constructor(
    private readonly vehicleRepository: IVehicleRepository,
    private readonly customerRepository: ICustomerRepository
  ) {}

  async execute(command: CreateVehicleCommand): Promise<VehicleDTO> {
    const { dto } = command;

    // Validate DTO
    const validation = dto.validate();
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // Check if customer exists
    const customer = await this.customerRepository.findById(dto.customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Check for duplicate plate number
    const existingVehicle = await this.vehicleRepository.findByPlate(dto.licensePlate, dto.tenantId);
    if (existingVehicle) {
      throw new Error('Vehicle with this plate number already exists');
    }

    // Create vehicle
    const vehicle = {
      id: uuidv4(),
      customerId: dto.customerId,
      tenantId: dto.tenantId,
      make: dto.make,
      model: dto.model,
      year: dto.year,
      licensePlate: dto.licensePlate,
      vin: dto.vin,
      color: dto.color,
      notes: dto.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save vehicle
    const savedVehicle = await this.vehicleRepository.save(vehicle);

    return VehicleDTO.fromEntity(savedVehicle, 0);
  }
}
