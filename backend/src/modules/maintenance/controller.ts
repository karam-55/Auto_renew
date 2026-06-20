import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth';
import { MaintenanceService } from './service';
import { CreatePreventiveMaintenanceTemplateInput, UpdatePreventiveMaintenanceTemplateInput, CreatePreventiveMaintenanceLogInput, UpdatePreventiveMaintenanceLogInput } from './types';

export class MaintenanceController {
  private maintenanceService: MaintenanceService;

  constructor() {
    this.maintenanceService = new MaintenanceService();
  }

  setIo(io: any) {
    this.maintenanceService.setIo(io);
  }

  // ============================================
  // TEMPLATES
  // ============================================

  async createTemplate(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const tenantId = req.user.tenantId;
      const data: CreatePreventiveMaintenanceTemplateInput = req.body;

      const template = await this.maintenanceService.createTemplate(tenantId, data);

      res.status(201).json({
        success: true,
        data: template,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create maintenance template',
      });
    }
  }

  async getTemplates(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const tenantId = req.user.tenantId;
      const { page, limit, sortBy, sortOrder } = req.query;

      const result = await this.maintenanceService.getTemplates(tenantId, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get maintenance templates',
      });
    }
  }

  async getTemplateById(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const tenantId = req.user.tenantId;
      const { id } = req.params;

      const template = await this.maintenanceService.getTemplateById(tenantId, id);

      res.json({
        success: true,
        data: template,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error instanceof Error ? error.message : 'Maintenance template not found',
      });
    }
  }

  async updateTemplate(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const tenantId = req.user.tenantId;
      const { id } = req.params;
      const data: UpdatePreventiveMaintenanceTemplateInput = req.body;

      const template = await this.maintenanceService.updateTemplate(tenantId, id, data);

      res.json({
        success: true,
        data: template,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update maintenance template',
      });
    }
  }

  async deleteTemplate(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const tenantId = req.user.tenantId;
      const { id } = req.params;

      await this.maintenanceService.deleteTemplate(tenantId, id);

      res.json({
        success: true,
        message: 'Maintenance template deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete maintenance template',
      });
    }
  }

  // ============================================
  // LOGS
  // ============================================

  async createLog(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const tenantId = req.user.tenantId;
      const data: CreatePreventiveMaintenanceLogInput = req.body;

      const log = await this.maintenanceService.createLog(tenantId, data);

      res.status(201).json({
        success: true,
        data: log,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create maintenance log',
      });
    }
  }

  async getLogs(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const tenantId = req.user.tenantId;
      const { page, limit, sortBy, sortOrder, customerId, vehicleId, templateId, status, dateFrom, dateTo } = req.query;

      const result = await this.maintenanceService.getLogs(
        tenantId,
        {
          customerId: customerId as string,
          vehicleId: vehicleId as string,
          templateId: templateId as string,
          status: status as string,
          dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
          dateTo: dateTo ? new Date(dateTo as string) : undefined,
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
        error: error instanceof Error ? error.message : 'Failed to get maintenance logs',
      });
    }
  }

  async getLogById(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const tenantId = req.user.tenantId;
      const { id } = req.params;

      const log = await this.maintenanceService.getLogById(tenantId, id);

      res.json({
        success: true,
        data: log,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error instanceof Error ? error.message : 'Maintenance log not found',
      });
    }
  }

  async updateLog(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const tenantId = req.user.tenantId;
      const { id } = req.params;
      const data: UpdatePreventiveMaintenanceLogInput = req.body;

      const log = await this.maintenanceService.updateLog(tenantId, id, data);

      res.json({
        success: true,
        data: log,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update maintenance log',
      });
    }
  }

  async deleteLog(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const tenantId = req.user.tenantId;
      const { id } = req.params;

      await this.maintenanceService.deleteLog(tenantId, id);

      res.json({
        success: true,
        message: 'Maintenance log deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete maintenance log',
      });
    }
  }

  // ============================================
  // REMINDERS
  // ============================================

  async sendReminders(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const tenantId = req.user.tenantId;
      const { daysAhead } = req.body;

      const sentCount = await this.maintenanceService.sendReminders(tenantId, daysAhead || 7);

      res.json({
        success: true,
        data: { sentCount },
        message: `Sent ${sentCount} maintenance reminders`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send maintenance reminders',
      });
    }
  }

  async getUpcomingMaintenances(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const tenantId = req.user.tenantId;
      const { days } = req.query;

      const logs = await this.maintenanceService.getUpcomingMaintenances(tenantId, days ? parseInt(days as string) : 30);

      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get upcoming maintenances',
      });
    }
  }

  // ============================================
  // COMPLETION
  // ============================================

  async completeMaintenance(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const tenantId = req.user.tenantId;
      const { id } = req.params;
      const { actualKm } = req.body;

      const log = await this.maintenanceService.completeMaintenance(tenantId, id, actualKm);

      res.json({
        success: true,
        data: log,
        message: 'Maintenance completed and next schedule created',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete maintenance',
      });
    }
  }
}
