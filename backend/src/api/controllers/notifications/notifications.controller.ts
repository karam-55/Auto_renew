import { Request, Response } from 'express';
import { Logger } from '../../../infrastructure/logging/logger';
import { WhatsAppService } from '../../services/whatsapp.service';
import { AuthMiddleware, UserRole } from '../../middlewares/auth.middleware';

export class NotificationsController {
  private whatsappService: WhatsAppService;

  constructor() {
    this.whatsappService = new WhatsAppService();
  }

  async getWhatsAppMessages(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const limit = parseInt(req.query.limit as string) || 50;

      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      const messages = await this.whatsappService.getWhatsAppMessages(tenantId, limit);
      res.json({ success: true, data: messages });
    } catch (error) {
      Logger.error('Get WhatsApp messages error:', error);
      res.status(500).json({ success: false, error: 'Failed to get WhatsApp messages' });
    }
  }
}
