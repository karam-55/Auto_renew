import { Request, Response } from 'express';
import { Logger } from '../../../infrastructure/logging/logger';
import { AddVehicle } from '../../../application/customers/use-cases/AddVehicle';
import { UpdateVehicle } from '../../../application/customers/use-cases/UpdateVehicle';
import { DeleteVehicle } from '../../../application/customers/use-cases/DeleteVehicle';
import { PrismaCustomerVehicleRepository } from '../../../infrastructure/customers/repositories/PrismaCustomerVehicleRepository';

export class CustomerVehicleController {
  private addVehicle: AddVehicle;
  private updateVehicle: UpdateVehicle;
  private deleteVehicle: DeleteVehicle;

  constructor() {
    const vehicleRepository = new PrismaCustomerVehicleRepository();
    this.addVehicle = new AddVehicle(vehicleRepository);
    this.updateVehicle = new UpdateVehicle(vehicleRepository);
    this.deleteVehicle = new DeleteVehicle(vehicleRepository);
  }

  async add(req: Request, res: Response): Promise<void> {
    try {
      const { customerId, tenantId, make, model, year, licensePlate, vin, color, notes } = req.body;

      const vehicle = await this.addVehicle.execute(
        customerId,
        tenantId,
        make,
        model,
        year,
        licensePlate,
        vin,
        color,
        notes
      );

      res.status(201).json({
        id: vehicle.id,
        customerId: vehicle.customerId,
        tenantId: vehicle.tenantId,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        licensePlate: vehicle.plateNumber.getValue(),
        vin: vehicle.vin,
        publicCarId: vehicle.publicCarId,
        currentKm: vehicle.currentKm,
        color: vehicle.color,
        notes: vehicle.notes,
        createdAt: vehicle.createdAt,
        updatedAt: vehicle.updatedAt,
      });
    } catch (error) {
      Logger.error('Add vehicle error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to add vehicle';
      
      if (errorMessage === 'Vehicle with this license plate already exists') {
        res.status(400).json({ error: errorMessage });
        return;
      }
      
      res.status(500).json({ error: 'Failed to add vehicle' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { make, model, year, licensePlate, vin, currentKm, color, notes } = req.body;

      const vehicle = await this.updateVehicle.execute(
        id,
        make,
        model,
        year,
        licensePlate,
        vin,
        currentKm,
        color,
        notes
      );

      res.json({
        id: vehicle.id,
        customerId: vehicle.customerId,
        tenantId: vehicle.tenantId,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        licensePlate: vehicle.plateNumber.getValue(),
        vin: vehicle.vin,
        publicCarId: vehicle.publicCarId,
        currentKm: vehicle.currentKm,
        color: vehicle.color,
        notes: vehicle.notes,
        createdAt: vehicle.createdAt,
        updatedAt: vehicle.updatedAt,
      });
    } catch (error) {
      Logger.error('Update vehicle error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to update vehicle';
      
      if (errorMessage === 'Vehicle not found') {
        res.status(404).json({ error: errorMessage });
        return;
      }
      
      res.status(500).json({ error: 'Failed to update vehicle' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await this.deleteVehicle.execute(id);

      res.json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
      Logger.error('Delete vehicle error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete vehicle';
      
      if (errorMessage === 'Vehicle not found') {
        res.status(404).json({ error: errorMessage });
        return;
      }
      
      res.status(500).json({ error: 'Failed to delete vehicle' });
    }
  }
}
