import { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { WhatsAppService } from './service';
import { AuthRequest, authorize } from '../../shared/middlewares/auth';
import { Logger } from '../../infrastructure/logging/logger';
import {
  WhatsAppConfig,
  BookingNotificationData,
  InstallmentReminderData,
  InvoiceNotificationData
} from './types';

export class WhatsAppController {
  private whatsappService: WhatsAppService;

  constructor() {
    this.whatsappService = new WhatsAppService();
  }

  setIo(io: SocketIOServer) {
    this.whatsappService.setIo(io);
  }

  // ============================================
  // MESSAGE LOG ENDPOINTS
  // ============================================

  getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const limit = parseInt(req.query.limit as string) || 50;

      // Return empty array since WhatsApp messages are sent via external API
      // and not stored locally. This prevents frontend 404 errors.
      res.status(200).json({
        success: true,
        data: [],
      });
    } catch (error) {
      Logger.error('Get WhatsApp messages error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get WhatsApp messages',
      });
    }
  };

  // ============================================
  // CONFIGURATION ENDPOINTS
  // ============================================

  getConfig = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const config = this.whatsappService.getConfig();
      
      // Don't expose the API key in the response
      const safeConfig = {
        ...config,
        apiKey: config.apiKey ? '***HIDDEN***' : '',
      };

      res.status(200).json({
        success: true,
        data: safeConfig,
      });
    } catch (error) {
      Logger.error('Get WhatsApp config error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get WhatsApp config',
      });
    }
  };

  updateConfig = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Only OWNER can update WhatsApp config
      if (req.user!.role !== 'OWNER') {
        res.status(403).json({
          success: false,
          error: 'Only OWNER can update WhatsApp configuration',
        });
        return;
      }

      const config: Partial<WhatsAppConfig> = req.body;
      this.whatsappService.updateConfig(config);

      res.status(200).json({
        success: true,
        message: 'WhatsApp configuration updated successfully',
      });
    } catch (error) {
      Logger.error('Update WhatsApp config error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update WhatsApp config',
      });
    }
  };

  testConnection = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const result = await this.whatsappService.testConnection();

      res.status(200).json({
        success: result.success,
        message: result.message,
      });
    } catch (error) {
      Logger.error('Test WhatsApp connection error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to test WhatsApp connection',
      });
    }
  };

  // ============================================
  // BOOKING NOTIFICATIONS ENDPOINTS
  // ============================================

  sendBookingConfirmation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const data: BookingNotificationData = req.body;
      const result = await this.whatsappService.sendBookingConfirmation(data);

      res.status(200).json({
        success: result.success,
        data: result,
      });
    } catch (error) {
      Logger.error('Send booking confirmation error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send booking confirmation',
      });
    }
  };

  sendBookingStatusUpdate = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const data: BookingNotificationData = req.body;
      const result = await this.whatsappService.sendBookingStatusUpdate(data);

      res.status(200).json({
        success: result.success,
        data: result,
      });
    } catch (error) {
      Logger.error('Send booking status update error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send booking status update',
      });
    }
  };

  // ============================================
  // INSTALLMENT NOTIFICATIONS ENDPOINTS
  // ============================================

  sendInstallmentReminder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const data: InstallmentReminderData = req.body;
      const result = await this.whatsappService.sendInstallmentReminder(data);

      res.status(200).json({
        success: result.success,
        data: result,
      });
    } catch (error) {
      Logger.error('Send installment reminder error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send installment reminder',
      });
    }
  };

  sendInstallmentOverdue = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const data: InstallmentReminderData = req.body;
      const result = await this.whatsappService.sendInstallmentOverdue(data);

      res.status(200).json({
        success: result.success,
        data: result,
      });
    } catch (error) {
      Logger.error('Send installment overdue error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send installment overdue',
      });
    }
  };

  // ============================================
  // INVOICE NOTIFICATIONS ENDPOINTS
  // ============================================

  sendInvoiceNotification = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const data: InvoiceNotificationData = req.body;
      const result = await this.whatsappService.sendInvoiceNotification(data);

      res.status(200).json({
        success: result.success,
        data: result,
      });
    } catch (error) {
      Logger.error('Send invoice notification error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send invoice notification',
      });
    }
  };

  sendPaymentConfirmation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const data: InvoiceNotificationData = req.body;
      const result = await this.whatsappService.sendPaymentConfirmation(data);

      res.status(200).json({
        success: result.success,
        data: result,
      });
    } catch (error) {
      Logger.error('Send payment confirmation error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send payment confirmation',
      });
    }
  };

  // ============================================
  // LOYALTY NOTIFICATIONS ENDPOINTS
  // ============================================

  sendLoyaltyPointsEarned = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { customerName, customerPhone, points, garageName } = req.body;
      const result = await this.whatsappService.sendLoyaltyPointsEarned(
        customerName,
        customerPhone,
        points,
        garageName
      );

      res.status(200).json({
        success: result.success,
        data: result,
      });
    } catch (error) {
      Logger.error('Send loyalty points earned error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send loyalty points earned',
      });
    }
  };

  sendLoyaltyTierUpgrade = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { customerName, customerPhone, newTier, garageName } = req.body;
      const result = await this.whatsappService.sendLoyaltyTierUpgrade(
        customerName,
        customerPhone,
        newTier,
        garageName
      );

      res.status(200).json({
        success: result.success,
        data: result,
      });
    } catch (error) {
      Logger.error('Send loyalty tier upgrade error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send loyalty tier upgrade',
      });
    }
  };

  // ============================================
  // MAINTENANCE REMINDER ENDPOINT
  // ============================================

  sendMaintenanceReminder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const reminder = req.body;
      const result = await this.whatsappService.sendMaintenanceReminder(reminder);

      res.status(200).json({
        success: result.success,
        data: result,
      });
    } catch (error) {
      Logger.error('Send maintenance reminder error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send maintenance reminder',
      });
    }
  };
}