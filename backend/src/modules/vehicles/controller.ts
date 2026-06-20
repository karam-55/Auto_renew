import { Request, Response } from 'express';
import { VehicleService } from './service';
import { VehicleService as VehicleManagementService } from './vehicle.service';
import { AuthRequest } from '../../shared/middlewares/auth';
import { logAuditFromRequest } from '../../middleware/audit.middleware';
import { Logger } from '../../infrastructure/logging/logger';
import { getPaginationParams, createPaginatedResponse } from '../../shared/utils/pagination';
import { ApiResponseBuilder } from '../../shared/utils/api-response';

export class VehicleController {
  private vehicleService: VehicleService;
  private vehicleManagementService: VehicleManagementService;

  constructor() {
    Logger.debug('VehicleController initialized');
    this.vehicleService = new VehicleService();
    this.vehicleManagementService = new VehicleManagementService();
  }

  getAllVehicles = async (req: AuthRequest, res: Response) => {
    try {
      const { page, limit, skip } = getPaginationParams(req);
      const [vehicles, total] = await Promise.all([
        this.vehicleService.getAllVehicles(req.user!.tenantId, skip, limit),
        this.vehicleService.getVehiclesCount(req.user!.tenantId),
      ]);
      res.json(ApiResponseBuilder.paginated(vehicles, total, page, limit));
    } catch (error) {
      Logger.error('Get all vehicles error', error);
      res.status(500).json(ApiResponseBuilder.error('FETCH_FAILED', 'Failed to fetch vehicles'));
    }
  };

  getVehicleById = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const vehicle = await this.vehicleService.getVehicleById(req.user!.tenantId, id);

      if (!vehicle) {
        return res.status(404).json(ApiResponseBuilder.notFound('Vehicle'));
      }

      res.json(ApiResponseBuilder.success(vehicle));
    } catch (error) {
      Logger.error('Get vehicle error', error);
      res.status(500).json(ApiResponseBuilder.error('FETCH_FAILED', 'Failed to fetch vehicle'));
    }
  };

  getVehiclesByCustomer = async (req: AuthRequest, res: Response) => {
    try {
      const { customerId } = req.params;
      const vehicles = await this.vehicleService.getVehiclesByCustomer(req.user!.tenantId, customerId);
      res.json(ApiResponseBuilder.success(vehicles));
    } catch (error) {
      Logger.error('Get vehicles by customer error', error);
      res.status(500).json(ApiResponseBuilder.error('FETCH_FAILED', 'Failed to fetch vehicles'));
    }
  };

  searchVehicles = async (req: AuthRequest, res: Response) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Search query required' });
      }

      const vehicles = await this.vehicleService.searchVehicles(req.user!.tenantId, q);
      res.json({ vehicles });
    } catch (error) {
      Logger.error('Search vehicles error', error);
      res.status(500).json({ error: 'Failed to search vehicles' });
    }
  };

  createVehicle = async (req: AuthRequest, res: Response) => {
    try {
      const vehicle = await this.vehicleService.createVehicle(req.user!.tenantId, req.body);

      // Log audit
      logAuditFromRequest(req, 'VEHICLE_CREATED', 'Vehicle', vehicle.id, null, vehicle);

      // Add history entry
      await this.vehicleManagementService.addHistoryEntry({
        tenantId: req.user!.tenantId,
        vehicleId: vehicle.id,
        description: `Vehicle created: ${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`,
        type: 'NOTE',
      });

      res.status(201).json({ vehicle });
    } catch (error: any) {
      Logger.error('Create vehicle error', error);
      res.status(400).json({ error: error.message || 'Failed to create vehicle' });
    }
  };

  updateVehicle = async (req: AuthRequest, res: Response) => {
    try {
      Logger.debug('Update vehicle called', { vehicleId: req.params.id, tenantId: req.user!.tenantId });

      const { id } = req.params;
      const oldVehicle = await this.vehicleService.getVehicleById(req.user!.tenantId, id);
      const vehicle = await this.vehicleService.updateVehicle(req.user!.tenantId, id, req.body);

      Logger.debug('Vehicle updated successfully', { vehicleId: vehicle.id });

      // Log audit
      logAuditFromRequest(req, 'VEHICLE_UPDATED', 'Vehicle', vehicle.id, oldVehicle, vehicle);

      // Add history entry
      Logger.debug('Adding history entry for vehicle', { vehicleId: vehicle.id, tenantId: req.user!.tenantId });
      await this.vehicleManagementService.addHistoryEntry({
        tenantId: req.user!.tenantId,
        vehicleId: vehicle.id,
        description: `Vehicle updated: ${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`,
        type: 'NOTE',
      });
      Logger.debug('History entry added successfully');

      res.json({ vehicle });
    } catch (error: any) {
      Logger.error('Update vehicle error', error);
      res.status(400).json({ error: error.message || 'Failed to update vehicle' });
    }
  };

  updateMileage = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { mileage } = req.body;
      if (typeof mileage !== 'number') {
        return res.status(400).json({ error: 'Mileage must be a number' });
      }

      const oldVehicle = await this.vehicleService.getVehicleById(req.user!.tenantId, id);
      const vehicle = await this.vehicleService.updateMileage(req.user!.tenantId, id, mileage);

      // Log audit
      logAuditFromRequest(req, 'VEHICLE_MILEAGE_UPDATED', 'Vehicle', vehicle.id, oldVehicle, vehicle);

      // Add history entry
      await this.vehicleManagementService.addHistoryEntry({
        tenantId: req.user!.tenantId,
        vehicleId: vehicle.id,
        description: `Mileage updated to ${mileage} km`,
        type: 'NOTE',
      });

      res.json({ vehicle });
    } catch (error: any) {
      Logger.error('Update mileage error', error);
      res.status(400).json({ error: error.message || 'Failed to update mileage' });
    }
  };

  deleteVehicle = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const oldVehicle = await this.vehicleService.getVehicleById(req.user!.tenantId, id);
      await this.vehicleService.deleteVehicle(req.user!.tenantId, id);

      // Log audit
      logAuditFromRequest(req, 'VEHICLE_DELETED', 'Vehicle', id, oldVehicle, null);

      res.json({ message: 'Vehicle deleted successfully' });
    } catch (error: any) {
      Logger.error('Delete vehicle error', error);
      res.status(400).json({ error: error.message || 'Failed to delete vehicle' });
    }
  };

  getVehicleHistory = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { type, startDate, endDate } = req.query;

      const filters: any = {};
      if (type) filters.type = type as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const history = await this.vehicleManagementService.getVehicleHistory(id, filters);
      res.json({ history });
    } catch (error: any) {
      Logger.error('Get vehicle history error', error);
      res.status(500).json({ error: error.message || 'Failed to fetch vehicle history' });
    }
  };
}
