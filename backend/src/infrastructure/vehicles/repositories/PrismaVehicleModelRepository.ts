import { VehicleModelRepository } from '../../../application/vehicles/interfaces/VehicleModelRepository';
import { VehicleModel } from '../../../domain/vehicles/entities/VehicleModel';

export class PrismaVehicleModelRepository implements VehicleModelRepository {
  async findById(id: string): Promise<VehicleModel | null> {
    // Since VehicleModel doesn't exist in Prisma schema, we'll return null for now
    // This can be implemented when the schema is updated
    return null;
  }

  async findByBrandId(brandId: string): Promise<VehicleModel[]> {
    return [];
  }

  async findByName(name: string): Promise<VehicleModel | null> {
    return null;
  }

  async findAll(): Promise<VehicleModel[]> {
    return [];
  }

  async findActive(): Promise<VehicleModel[]> {
    return [];
  }

  async create(model: VehicleModel): Promise<VehicleModel> {
    return model;
  }

  async update(model: VehicleModel): Promise<VehicleModel> {
    return model;
  }

  async delete(id: string): Promise<void> {
    // Placeholder
  }
}
