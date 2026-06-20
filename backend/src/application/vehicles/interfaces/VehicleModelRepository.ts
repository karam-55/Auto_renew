import { VehicleModel } from '../../../domain/vehicles/entities/VehicleModel';

export interface VehicleModelRepository {
  findById(id: string): Promise<VehicleModel | null>;
  findByBrandId(brandId: string): Promise<VehicleModel[]>;
  findByName(name: string): Promise<VehicleModel | null>;
  findAll(): Promise<VehicleModel[]>;
  findActive(): Promise<VehicleModel[]>;
  create(model: VehicleModel): Promise<VehicleModel>;
  update(model: VehicleModel): Promise<VehicleModel>;
  delete(id: string): Promise<void>;
}
