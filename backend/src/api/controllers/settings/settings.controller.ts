import { Request, Response } from 'express';
import { Logger } from '../../../infrastructure/logging/logger';
import { AuthRequest } from '../../../shared/middlewares/auth';
import settingsService from '../../../services/settings.service';
import { logAuditFromRequest } from '../../../middleware/audit.middleware';

export class SettingsController {
  // GET /api/settings - Get full settings (protected)
  async getSettings(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;

      const settings = await settingsService.getSettings(tenantId);

      res.json({ success: true, data: settings });
    } catch (error) {
      Logger.error('Get settings error:', error);
      res.status(500).json({ success: false, error: 'Failed to get settings' });
    }
  }

  // PUT /api/settings - Update settings (protected)
  async updateSettings(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;

      // Get old settings for audit log
      const oldSettings = await settingsService.getSettings(tenantId);

      // Update settings
      const newSettings = await settingsService.updateSettings(tenantId, req.body);

      // Log settings update
      logAuditFromRequest(req, 'SETTINGS_UPDATED', 'CompanySettings', tenantId, oldSettings, newSettings);

      res.json({ success: true, data: newSettings });
    } catch (error: any) {
      Logger.error('Update settings error:', error);
      res.status(400).json({ success: false, error: error.message || 'Failed to update settings' });
    }
  }

  // GET /api/settings/public - Get public settings (no auth)
  async getPublicSettings(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      const settings = await settingsService.getPublicSettings(tenantId);

      res.json({ success: true, data: settings });
    } catch (error) {
      Logger.error('Get public settings error:', error);
      res.status(500).json({ success: false, error: 'Failed to get public settings' });
    }
  }

  // Legacy endpoint for backward compatibility
  async getNotificationSettings(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      const settings = await settingsService.getSettings(tenantId);

      res.json({ 
        success: true, 
        data: {
          enableWhatsAppNotifications: settings.enableWhatsAppNotifications,
          whatsappPhoneNumberId: settings.whatsappPhoneNumberId,
          whatsappAccessToken: settings.whatsappAccessToken,
          whatsappBusinessAccountId: settings.whatsappBusinessAccountId,
        }
      });
    } catch (error) {
      Logger.error('Get notification settings error:', error);
      res.status(500).json({ success: false, error: 'Failed to get notification settings' });
    }
  }

  // Legacy endpoint for backward compatibility
  async updateNotificationSettings(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      const {
        enableWhatsAppNotifications,
        whatsappPhoneNumberId,
        whatsappAccessToken,
        whatsappBusinessAccountId,
      } = req.body;

      const oldSettings = await settingsService.getSettings(tenantId);
      const newSettings = await settingsService.updateSettings(tenantId, {
        enableWhatsAppNotifications,
        whatsappPhoneNumberId,
        whatsappAccessToken,
        whatsappBusinessAccountId,
      });

      // Log settings update
      logAuditFromRequest(req, 'SETTINGS_UPDATED', 'CompanySettings', tenantId, oldSettings, newSettings);

      res.json({ 
        success: true, 
        data: {
          enableWhatsAppNotifications: newSettings.enableWhatsAppNotifications,
          whatsappPhoneNumberId: newSettings.whatsappPhoneNumberId,
          whatsappAccessToken: newSettings.whatsappAccessToken,
          whatsappBusinessAccountId: newSettings.whatsappBusinessAccountId,
        }
      });
    } catch (error) {
      Logger.error('Update notification settings error:', error);
      res.status(500).json({ success: false, error: 'Failed to update notification settings' });
    }
  }
}
