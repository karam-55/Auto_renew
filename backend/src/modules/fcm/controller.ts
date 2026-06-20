import { Request, Response } from 'express';
import { Logger } from '../../infrastructure/logging/logger';
import { FCMService } from './service';
import { AuthRequest, authorize } from '../../shared/middlewares/auth';
import { RegisterFCMTokenInput, FCMNotification } from './types';

export class FCMController {
  private fcmService: FCMService;

  constructor() {
    this.fcmService = new FCMService();
  }

  setIo(io: any) {
    this.fcmService.setIo(io);
  }

  // ============================================
  // CONFIGURATION ENDPOINTS
  // ============================================

  getConfig = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const config = this.fcmService.getConfig();

      res.status(200).json({
        success: true,
        data: config,
      });
    } catch (error) {
      Logger.error('Get FCM config error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get FCM config',
      });
    }
  };

  updateConfig = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Only OWNER can update FCM config
      if (req.user!.role !== 'OWNER') {
        res.status(403).json({
          success: false,
          error: 'Only OWNER can update FCM configuration',
        });
        return;
      }

      const config = req.body;
      this.fcmService.updateConfig(config);

      res.status(200).json({
        success: true,
        message: 'FCM configuration updated successfully',
      });
    } catch (error) {
      Logger.error('Update FCM config error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update FCM config',
      });
    }
  };

  testConnection = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const result = await this.fcmService.testConnection();

      res.status(200).json({
        success: result.success,
        message: result.message,
      });
    } catch (error) {
      Logger.error('Test FCM connection error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to test FCM connection',
      });
    }
  };

  // ============================================
  // TOKEN MANAGEMENT ENDPOINTS
  // ============================================

  registerToken = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const data: RegisterFCMTokenInput = req.body;

      const token = await this.fcmService.registerToken(tenantId, userId, data);

      res.status(201).json({
        success: true,
        data: token,
      });
    } catch (error) {
      Logger.error('Register FCM token error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to register FCM token',
      });
    }
  };

  unregisterToken = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const { token } = req.body;

      await this.fcmService.unregisterToken(tenantId, userId, token);

      res.status(200).json({
        success: true,
        message: 'FCM token unregistered successfully',
      });
    } catch (error) {
      Logger.error('Unregister FCM token error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to unregister FCM token',
      });
    }
  };

  getUserTokens = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;

      const tokens = await this.fcmService.getUserTokens(tenantId, userId);

      res.status(200).json({
        success: true,
        data: tokens,
      });
    } catch (error) {
      Logger.error('Get user FCM tokens error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user FCM tokens',
      });
    }
  };

  // ============================================
  // NOTIFICATION ENDPOINTS
  // ============================================

  sendNotification = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Only OWNER, MANAGER can send notifications
      if (!['OWNER', 'MANAGER'].includes(req.user!.role)) {
        res.status(403).json({
          success: false,
          error: 'Only OWNER and MANAGER can send notifications',
        });
        return;
      }

      const { userId, notification } = req.body;
      const tenantId = req.user!.tenantId;

      const result = await this.fcmService.sendNotificationToUser(tenantId, userId, notification);

      res.status(200).json({
        success: result.success,
        data: result,
      });
    } catch (error) {
      Logger.error('Send FCM notification error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send FCM notification',
      });
    }
  };

  sendBookingAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const data = req.body;
      const result = await this.fcmService.sendBookingAssignment(data);

      res.status(200).json({
        success: result.success,
        data: result,
      });
    } catch (error) {
      Logger.error('Send booking assignment notification error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send booking assignment notification',
      });
    }
  };

  sendBookingStatusUpdate = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const data = req.body;
      const result = await this.fcmService.sendBookingStatusUpdate(data);

      res.status(200).json({
        success: result.success,
        data: result,
      });
    } catch (error) {
      Logger.error('Send booking status update notification error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send booking status update notification',
      });
    }
  };
}