import { Request, Response } from 'express';
import { NotificationRulesService } from '../notifications/notification-rules.service';
import { AuthRequest } from '../../shared/middlewares/auth';

export class NotificationRulesController {
  private service = new NotificationRulesService();

  async createRule(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const { name, nameAr, eventType, channels, conditions } = req.body;
      const rule = await this.service.createRule(
        tenantId,
        name,
        nameAr,
        eventType,
        channels,
        conditions
      );
      res.status(201).json({ success: true, data: rule });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to create notification rule' });
    }
  }

  async getActiveRules(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const { eventType } = req.query;
      const rules = await this.service.getActiveRules(
        tenantId,
        eventType as string
      );
      res.json({ success: true, data: rules });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch active rules' });
    }
  }

  async triggerEvent(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const { eventType, data } = req.body;
      await this.service.triggerEvent(tenantId, eventType, data);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to trigger event' });
    }
  }

  async getRules(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const rules = await this.service.getRules(tenantId);
      res.json({ success: true, data: rules });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch rules' });
    }
  }

  async updateRule(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const rule = await this.service.updateRule(id, updates);
      res.json({ success: true, data: rule });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to update rule' });
    }
  }

  async deleteRule(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await this.service.deleteRule(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to delete rule' });
    }
  }
}
