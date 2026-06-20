import { Request, Response } from 'express';
import { Logger } from '../../infrastructure/logging/logger';
import { WarehouseService } from './service';
import { AuthRequest } from '../../shared/middlewares/auth';

export class WarehouseController {
  private warehouseService: WarehouseService;

  constructor() {
    this.warehouseService = new WarehouseService();
  }

  createWarehouse = async (req: AuthRequest, res: Response) => {
    try {
      const warehouse = await this.warehouseService.createWarehouse(req.user!.tenantId, req.body);
      res.status(201).json({ warehouse });
    } catch (error: any) {
      Logger.error('Create warehouse error:', error);
      res.status(400).json({ error: error.message || 'Failed to create warehouse' });
    }
  };

  getWarehouses = async (req: AuthRequest, res: Response) => {
    try {
      const warehouses = await this.warehouseService.getWarehouses(req.user!.tenantId);
      res.json({ data: warehouses });
    } catch (error) {
      Logger.error('Get warehouses error:', error);
      res.status(500).json({ error: 'Failed to fetch warehouses' });
    }
  };

  getWarehouseById = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const warehouse = await this.warehouseService.getWarehouseById(id, req.user!.tenantId);

      if (!warehouse) {
        return res.status(404).json({ error: 'Warehouse not found' });
      }

      res.json({ warehouse });
    } catch (error) {
      Logger.error('Get warehouse error:', error);
      res.status(500).json({ error: 'Failed to fetch warehouse' });
    }
  };

  updateWarehouse = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const warehouse = await this.warehouseService.updateWarehouse(id, req.user!.tenantId, req.body);
      res.json({ warehouse });
    } catch (error: any) {
      Logger.error('Update warehouse error:', error);
      res.status(400).json({ error: error.message || 'Failed to update warehouse' });
    }
  };

  deleteWarehouse = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await this.warehouseService.deleteWarehouse(id, req.user!.tenantId);
      res.json({ message: 'Warehouse deleted successfully' });
    } catch (error: any) {
      Logger.error('Delete warehouse error:', error);
      res.status(400).json({ error: error.message || 'Failed to delete warehouse' });
    }
  };

  getWarehouseCapacity = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const capacity = await this.warehouseService.getWarehouseCapacity(req.user!.tenantId, id);
      res.json({ capacity });
    } catch (error: any) {
      Logger.error('Get warehouse capacity error:', error);
      res.status(400).json({ error: error.message || 'Failed to fetch warehouse capacity' });
    }
  };
}
