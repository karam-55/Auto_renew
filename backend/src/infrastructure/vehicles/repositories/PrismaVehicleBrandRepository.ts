import { VehicleBrandRepository } from '../../../application/vehicles/interfaces/VehicleBrandRepository';
import { VehicleBrand } from '../../../domain/vehicles/entities/VehicleBrand';

export class PrismaVehicleBrandRepository implements VehicleBrandRepository {
  async findById(id: string): Promise<VehicleBrand | null> {
    // Since VehicleBrand doesn't exist in Prisma schema, we'll return null for now
    // This can be implemented when the schema is updated
    return null;
  }

  async findByName(name: string): Promise<VehicleBrand | null> {
    return null;
  }

  async findAll(): Promise<VehicleBrand[]> {
    return [];
  }

  async findActive(): Promise<VehicleBrand[]> {
    return [];
  }

  async create(brand: VehicleBrand): Promise<VehicleBrand> {
    return brand;
  }

  async update(brand: VehicleBrand): Promise<VehicleBrand> {
    return brand;
  }

  async delete(id: string): Promise<void> {
    // Placeholder
  }
}
