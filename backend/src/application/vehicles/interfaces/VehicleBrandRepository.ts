import { VehicleBrand } from '../../../domain/vehicles/entities/VehicleBrand';

export interface VehicleBrandRepository {
  findById(id: string): Promise<VehicleBrand | null>;
  findByName(name: string): Promise<VehicleBrand | null>;
  findAll(): Promise<VehicleBrand[]>;
  findActive(): Promise<VehicleBrand[]>;
  create(brand: VehicleBrand): Promise<VehicleBrand>;
  update(brand: VehicleBrand): Promise<VehicleBrand>;
  delete(id: string): Promise<void>;
}
