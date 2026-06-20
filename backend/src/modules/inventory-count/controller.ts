import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth';
import { InventoryCountService } from './service';
import { CreateInventoryCountInput, UpdateInventoryCountInput, CreateInventoryCountItemInput, UpdateInventoryCountItemInput } from './types';

export class InventoryCountController {
  private inventoryCountService: InventoryCountService;

  constructor() {
    this.inventoryCountService = new InventoryCountService();
  }

  // ============================================
  // INVENTORY COUNTS
  // ============================================

  async createCount(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const data: CreateInventoryCountInput = req.body;

      const count = await this.inventoryCountService.createCount(tenantId, userId, data);

      res.status(201).json({
        success: true,
        data: count,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create inventory count',
      });
    }
  }

  async getCounts(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const tenantId = req.user.tenantId;
      const { page, limit, sortBy, sortOrder, warehouseId, status, dateFrom, dateTo, countNumber } = req.query;

      const result = await this.inventoryCountService.getCounts(
        tenantId,
        {
          warehouseId: warehouseId as string,
          status: status as string,
          dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
          dateTo: dateTo ? new Date(dateTo as string) : undefined,
          countNumber: countNumber as string,
        },
        {
          page: page ? parseInt(page as string) : undefined,
          limit: limit ? parseInt(limit as string) : undefined,
          sortBy: sortBy as string,
          sortOrder: sortOrder as 'asc' | 'desc',
        }
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get inventory counts',
      });
    }
  }

  async getCountById(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const tenantId = req.user.tenantId;
      const { id } = req.params;

      const count = await this.inventoryCountService.getCountById(tenantId, id);

      res.json({
        success: true,
        data: count,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error instanceof Error ? error.message : 'Inventory count not found',
      });
    }
  }

  async updateCount(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const tenantId = req.user.tenantId;
      const { id } = req.params;
      const data: UpdateInventoryCountInput = req.body;

      const count = await this.inventoryCountService.updateCount(tenantId, id, data);

      res.json({
        success: true,
        data: count,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update inventory count',
      });
    }
  }

  async approveCount(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const { id } = req.params;

      const count = await this.inventoryCountService.approveCount(tenantId, id, userId);

      res.json({
        success: true,
        data: count,
        message: 'Inventory count approved and inventory adjusted',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to approve inventory count',
      });
    }
  }

  async deleteCount(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const tenantId = req.user.tenantId;
      const { id } = req.params;

      await this.inventoryCountService.deleteCount(tenantId, id);

      res.json({
        success: true,
        message: 'Inventory count deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete inventory count',
      });
    }
  }

  // ============================================
  // INVENTORY COUNT ITEMS
  // ============================================

  async addItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const tenantId = req.user.tenantId;
      const { id } = req.params;
      const data: CreateInventoryCountItemInput = req.body;

      const item = await this.inventoryCountService.addItem(tenantId, id, data);

      res.status(201).json({
        success: true,
        data: item,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add inventory count item',
      });
    }
  }

  async updateItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const tenantId = req.user.tenantId;
      const { id, itemId } = req.params;
      const data: UpdateInventoryCountItemInput = req.body;

      const item = await this.inventoryCountService.updateItem(tenantId, id, itemId, data);

      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update inventory count item',
      });
    }
  }

  async deleteItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const tenantId = req.user.tenantId;
      const { id, itemId } = req.params;

      await this.inventoryCountService.deleteItem(tenantId, id, itemId);

      res.json({
        success: true,
        message: 'Inventory count item deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete inventory count item',
      });
    }
  }
}
