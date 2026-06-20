import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth';
import { costCenterService } from './service';

export class CostCenterController {
  // ─── Initialize Defaults ───
  async initializeDefaults(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const centers = await costCenterService.initializeDefaults(tenantId);
      res.json({ success: true, data: centers });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ─── Cost Centers CRUD ───
  async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const centers = await costCenterService.getAll(tenantId);
      res.json({ success: true, data: centers });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const center = await costCenterService.getById(tenantId, req.params.id);
      if (!center) {
        res.status(404).json({ success: false, error: 'Cost center not found' });
        return;
      }
      res.json({ success: true, data: center });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const center = await costCenterService.create(tenantId, req.body);
      res.status(201).json({ success: true, data: center });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const center = await costCenterService.update(tenantId, req.params.id, req.body);
      if (!center) {
        res.status(404).json({ success: false, error: 'Cost center not found' });
        return;
      }
      res.json({ success: true, data: center });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const deleted = await costCenterService.delete(tenantId, req.params.id);
      if (!deleted) {
        res.status(404).json({ success: false, error: 'Cost center not found' });
        return;
      }
      res.json({ success: true, message: 'Cost center deactivated' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ─── Allocations ───
  async getAllocations(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const allocs = await costCenterService.getAllocations(tenantId);
      res.json({ success: true, data: allocs });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async createAllocation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const alloc = await costCenterService.createAllocation(tenantId, req.body);
      res.status(201).json({ success: true, data: alloc });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async updateAllocation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const alloc = await costCenterService.updateAllocation(tenantId, req.params.id, req.body);
      if (!alloc) {
        res.status(404).json({ success: false, error: 'Allocation not found' });
        return;
      }
      res.json({ success: true, data: alloc });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async deleteAllocation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const deleted = await costCenterService.deleteAllocation(tenantId, req.params.id);
      if (!deleted) {
        res.status(404).json({ success: false, error: 'Allocation not found' });
        return;
      }
      res.json({ success: true, message: 'Allocation deactivated' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ─── Overhead Rates ───
  async getOverheadRates(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const rates = await costCenterService.calculateOverheadRates(tenantId);
      res.json({ success: true, data: rates });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ─── Service Cost Breakdown ───
  async calculateServiceCost(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const {
        serviceId,
        laborCostSYP,
        materialCostSYP,
        estimatedDurationMinutes,
        estimatedMaterialMoves,
        profitPercent,
        profitAmountSYP,
        exchangeRate,
      } = req.body;

      const breakdown = await costCenterService.calculateServiceCost(
        tenantId,
        serviceId,
        laborCostSYP || 0,
        materialCostSYP || 0,
        estimatedDurationMinutes || 60,
        estimatedMaterialMoves || 1,
        profitPercent || 0,
        profitAmountSYP || 0,
        exchangeRate || 15000
      );
      res.json({ success: true, data: breakdown });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ─── Service Cost Details ───
  async getServiceCostDetails(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const { serviceId } = req.params;
      const details = await costCenterService.getServiceCostDetails(tenantId, serviceId);
      res.json({ success: true, data: details });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async saveServiceCostDetails(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const { serviceId } = req.params;
      const { details } = req.body;
      const created = await costCenterService.saveServiceCostDetails(tenantId, serviceId, details || []);
      res.json({ success: true, data: created });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

export const costCenterController = new CostCenterController();
