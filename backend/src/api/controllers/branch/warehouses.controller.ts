import { Request, Response } from 'express';
import { Logger } from '../../../infrastructure/logging/logger';
import { WarehouseService } from '../../../modules/warehouse/warehouse.service';

const warehouseService = new WarehouseService();

export class WarehousesController {
  async getAllWarehouses(req: Request, res: Response) {
    try {
      const tenantId = req.branchContext?.tenantId;
      const branchId = req.branchContext?.branchId;
      
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID required' });
      }

      const warehouses = await warehouseService.getAllWarehouses(tenantId, branchId);
      res.json({ success: true, data: warehouses });
    } catch (error) {
      Logger.error('Error fetching warehouses:', error);
      res.status(500).json({ error: 'Failed to fetch warehouses' });
    }
  }

  async getWarehouseById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.branchContext?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID required' });
      }

      const warehouse = await warehouseService.getWarehouseById(id, tenantId);
      if (!warehouse) {
        return res.status(404).json({ error: 'Warehouse not found' });
      }

      res.json({ success: true, data: warehouse });
    } catch (error) {
      Logger.error('Error fetching warehouse:', error);
      res.status(500).json({ error: 'Failed to fetch warehouse' });
    }
  }

  async createWarehouse(req: Request, res: Response) {
    try {
      const tenantId = req.branchContext?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID required' });
      }

      const warehouseData = {
        ...req.body,
        tenant: { connect: { id: tenantId } },
      };

      const warehouse = await warehouseService.createWarehouse(warehouseData);
      res.status(201).json({ success: true, data: warehouse });
    } catch (error) {
      Logger.error('Error creating warehouse:', error);
      res.status(500).json({ error: 'Failed to create warehouse' });
    }
  }

  async updateWarehouse(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.branchContext?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID required' });
      }

      const warehouse = await warehouseService.updateWarehouse(id, tenantId, req.body);
      res.json({ success: true, data: warehouse });
    } catch (error) {
      Logger.error('Error updating warehouse:', error);
      res.status(500).json({ error: 'Failed to update warehouse' });
    }
  }

  async deleteWarehouse(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.branchContext?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID required' });
      }

      const warehouse = await warehouseService.deleteWarehouse(id, tenantId);
      res.json({ success: true, data: warehouse });
    } catch (error: any) {
      Logger.error('Error deleting warehouse:', error);
      res.status(400).json({ error: error.message || 'Failed to delete warehouse' });
    }
  }

  async getWarehouseStock(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.branchContext?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID required' });
      }

      const stock = await warehouseService.getWarehouseStock(id, tenantId);
      res.json({ success: true, data: stock });
    } catch (error) {
      Logger.error('Error fetching warehouse stock:', error);
      res.status(500).json({ error: 'Failed to fetch warehouse stock' });
    }
  }

  async setPrimaryWarehouse(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.branchContext?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID required' });
      }

      const warehouse = await warehouseService.setPrimaryWarehouse(id, tenantId);
      res.json({ success: true, data: warehouse });
    } catch (error: any) {
      Logger.error('Error setting primary warehouse:', error);
      res.status(400).json({ error: error.message || 'Failed to set primary warehouse' });
    }
  }
}
