import { Request, Response } from 'express';
import { Logger } from '../../../infrastructure/logging/logger';
import { CreateVehicle } from '../../../application/vehicles/use-cases/CreateVehicle';
import { UpdateVehicle } from '../../../application/vehicles/use-cases/UpdateVehicle';
import { GetVehicle } from '../../../application/vehicles/use-cases/GetVehicle';
import { ListVehicles } from '../../../application/vehicles/use-cases/ListVehicles';
import { DeleteVehicle } from '../../../application/vehicles/use-cases/DeleteVehicle';
import { AssignCustomerToVehicle } from '../../../application/vehicles/use-cases/AssignCustomerToVehicle';
import { PrismaVehicleRepository } from '../../../infrastructure/vehicles/repositories/PrismaVehicleRepository';

export class VehicleController {
  private createVehicle: CreateVehicle;
  private updateVehicle: UpdateVehicle;
  private getVehicle: GetVehicle;
  private listVehicles: ListVehicles;
  private deleteVehicle: DeleteVehicle;
  private assignCustomerToVehicle: AssignCustomerToVehicle;

  constructor() {
    Logger.debug('=== INTERFACE HTTP VEHICLE CONTROLLER CONSTRUCTOR CALLED ===');
    const vehicleRepository = new PrismaVehicleRepository();
    this.createVehicle = new CreateVehicle(vehicleRepository);
    this.updateVehicle = new UpdateVehicle(vehicleRepository);
    this.getVehicle = new GetVehicle(vehicleRepository);
    this.listVehicles = new ListVehicles(vehicleRepository);
    this.deleteVehicle = new DeleteVehicle(vehicleRepository);
    this.assignCustomerToVehicle = new AssignCustomerToVehicle(vehicleRepository);
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { customerId, tenantId, make, model, year, licensePlate, vin, color, notes } = req.body;

      const result = await this.createVehicle.execute(
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
        id: result.vehicle.id,
        customerId: result.vehicle.customerId,
        tenantId: result.vehicle.tenantId,
        make: result.vehicle.make,
        model: result.vehicle.model,
        year: result.vehicle.year,
        licensePlate: result.vehicle.plateNumber.getValue(),
        vin: result.vehicle.vin?.getValue(),
        publicCarId: result.vehicle.publicCarId,
        currentKm: result.vehicle.currentKm,
        color: result.vehicle.color,
        notes: result.vehicle.notes,
        createdAt: result.vehicle.createdAt,
        updatedAt: result.vehicle.updatedAt,
      });
    } catch (error) {
      Logger.error('Create vehicle error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to create vehicle';
      
      if (errorMessage === 'Vehicle with this license plate already exists') {
        res.status(400).json({ error: errorMessage });
        return;
      }
      
      res.status(500).json({ error: 'Failed to create vehicle' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      Logger.debug('=== INTERFACE HTTP VEHICLE CONTROLLER UPDATE CALLED ===');
      Logger.debug('Update vehicle', { vehicleId: req.params.id, body: req.body });

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

      Logger.debug('Vehicle updated successfully', { vehicleId: vehicle.id });

      res.json({
        id: vehicle.id,
        customerId: vehicle.customerId,
        tenantId: vehicle.tenantId,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        licensePlate: vehicle.plateNumber.getValue(),
        vin: vehicle.vin?.getValue(),
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

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const vehicle = await this.getVehicle.execute(id);

      res.json({
        id: vehicle.id,
        customerId: vehicle.customerId,
        tenantId: vehicle.tenantId,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        licensePlate: vehicle.plateNumber.getValue(),
        vin: vehicle.vin?.getValue(),
        publicCarId: vehicle.publicCarId,
        currentKm: vehicle.currentKm,
        color: vehicle.color,
        notes: vehicle.notes,
        createdAt: vehicle.createdAt,
        updatedAt: vehicle.updatedAt,
      });
    } catch (error) {
      Logger.error('Get vehicle error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to get vehicle';
      
      if (errorMessage === 'Vehicle not found') {
        res.status(404).json({ error: errorMessage });
        return;
      }
      
      res.status(500).json({ error: 'Failed to get vehicle' });
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, customerId } = req.query;

      if (!tenantId && !customerId) {
        res.status(400).json({ error: 'Tenant ID or Customer ID is required' });
        return;
      }

      let vehicles;
      if (customerId && typeof customerId === 'string') {
        vehicles = await this.listVehicles.executeByCustomer(customerId);
      } else if (tenantId && typeof tenantId === 'string') {
        vehicles = await this.listVehicles.execute(tenantId);
      } else {
        res.status(400).json({ error: 'Invalid query parameters' });
        return;
      }

      res.json(
        vehicles.map(vehicle => ({
          id: vehicle.id,
          customerId: vehicle.customerId,
          tenantId: vehicle.tenantId,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          licensePlate: vehicle.plateNumber.getValue(),
          vin: vehicle.vin?.getValue(),
          publicCarId: vehicle.publicCarId,
          currentKm: vehicle.currentKm,
          color: vehicle.color,
          notes: vehicle.notes,
          createdAt: vehicle.createdAt,
          updatedAt: vehicle.updatedAt,
        }))
      );
    } catch (error) {
      Logger.error('List vehicles error:', error);
      res.status(500).json({ error: 'Failed to list vehicles' });
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

  async assignCustomer(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { customerId } = req.body;

      const vehicle = await this.assignCustomerToVehicle.execute(id, customerId);

      res.json({
        id: vehicle.id,
        customerId: vehicle.customerId,
        tenantId: vehicle.tenantId,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        licensePlate: vehicle.plateNumber.getValue(),
        vin: vehicle.vin?.getValue(),
        publicCarId: vehicle.publicCarId,
        currentKm: vehicle.currentKm,
        color: vehicle.color,
        notes: vehicle.notes,
        createdAt: vehicle.createdAt,
        updatedAt: vehicle.updatedAt,
      });
    } catch (error) {
      Logger.error('Assign customer to vehicle error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign customer';
      
      if (errorMessage === 'Vehicle not found') {
        res.status(404).json({ error: errorMessage });
        return;
      }
      
      res.status(500).json({ error: 'Failed to assign customer' });
    }
  }
}
