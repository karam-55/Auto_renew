import { Request, Response } from 'express';
import { ErrorMiddleware } from '../../middlewares/error.middleware';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { VehicleRepository } from '../../../infrastructure/repositories/vehicles/VehicleRepository';

export class VehicleController {
  private vehicleRepository: VehicleRepository;

  constructor() {
    this.vehicleRepository = new VehicleRepository();
  }

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { customerId, make, model, year, licensePlate, vin, color, notes } = req.body;
      const tenantId = req.user?.tenantId || 'default';

      const vehicle = await this.vehicleRepository.save({
        id: crypto.randomUUID(),
        tenantId,
        customerId,
        make,
        model,
        year,
        licensePlate,
        vin,
        color,
        notes,
      });

      ErrorMiddleware.success(res, vehicle, 201);
    } catch (error) {
      ErrorMiddleware.error(res, 'CREATE_ERROR', 'Failed to create vehicle', 500);
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const vehicle = await this.vehicleRepository.findById(id);

      if (!vehicle) {
        ErrorMiddleware.error(res, 'NOT_FOUND', 'Vehicle not found', 404);
        return;
      }

      ErrorMiddleware.success(res, vehicle, 200);
    } catch (error) {
      ErrorMiddleware.error(res, 'FETCH_ERROR', 'Failed to fetch vehicle', 500);
    }
  }

  async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || 'default';
      const vehicles = await this.vehicleRepository.listAll(tenantId);

      ErrorMiddleware.success(res, vehicles, 200);
    } catch (error) {
      ErrorMiddleware.error(res, 'FETCH_ERROR', 'Failed to list vehicles', 500);
    }
  }

  async listByCustomer(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.params;
      const vehicles = await this.vehicleRepository.listByCustomer(customerId);

      ErrorMiddleware.success(res, vehicles, 200);
    } catch (error) {
      ErrorMiddleware.error(res, 'FETCH_ERROR', 'Failed to list customer vehicles', 500);
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { make, model, year, licensePlate, vin, color, notes } = req.body;

      const vehicle = await this.vehicleRepository.update({
        id,
        make,
        model,
        year,
        licensePlate,
        vin,
        color,
        notes,
      });

      ErrorMiddleware.success(res, vehicle, 200);
    } catch (error) {
      ErrorMiddleware.error(res, 'UPDATE_ERROR', 'Failed to update vehicle', 500);
    }
  }
}
