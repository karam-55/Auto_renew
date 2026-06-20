import admin from 'firebase-admin';
import { Logger } from '../../infrastructure/logging/logger';
import prisma from '../../config/database';
import {
  FCMConfig,
  FCMToken,
  RegisterFCMTokenInput,
  FCMNotification,
  BookingAssignmentNotification,
  BookingStatusNotification,
  FCMNotificationResult
} from './types';


export class FCMService {
  private app: admin.app.App | null = null;
  private config: FCMConfig;
  private io: any;

  constructor() {
    this.config = {
      serviceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '',
      isEnabled: process.env.FIREBASE_ENABLED === 'true',
    };

    this.initializeFirebase();
  }

  setIo(io: any) {
    this.io = io;
  }

  // ============================================
  // FIREBASE INITIALIZATION
  // ============================================

  private initializeFirebase(): void {
    if (!this.isEnabled()) {
      Logger.debug('Firebase FCM is not enabled');
      return;
    }

    try {
      const serviceAccountKey = JSON.parse(this.config.serviceAccountKey);
      
      this.app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccountKey),
      });

      Logger.debug('Firebase FCM initialized successfully');
    } catch (error) {
      Logger.error('Failed to initialize Firebase FCM:', error);
      this.app = null;
    }
  }

  // ============================================
  // CONFIGURATION MANAGEMENT
  // ============================================

  updateConfig(config: Partial<FCMConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Reinitialize Firebase if service account key changed
    if (config.serviceAccountKey && this.app) {
      try {
        // Firebase admin apps don't have a simple delete method
        // We'll just reinitialize by setting app to null
        this.app = null;
        this.initializeFirebase();
      } catch (error) {
        Logger.error('Error reinitializing Firebase app:', error);
      }
    }
  }

  getConfig(): FCMConfig {
    return {
      ...this.config,
      serviceAccountKey: this.config.serviceAccountKey ? '***HIDDEN***' : '',
    };
  }

  isEnabled(): boolean {
    return this.config.isEnabled === true && !!this.config.serviceAccountKey;
  }

  // ============================================
  // TOKEN MANAGEMENT
  // ============================================

  async registerToken(tenantId: string, userId: string, data: RegisterFCMTokenInput): Promise<FCMToken> {
    // Check if token already exists for this user
    const existingToken = await prisma.fCMToken.findFirst({
      where: {
        userId,
        token: data.token,
      },
    });

    if (existingToken) {
      // Update existing token
      const updatedToken = await prisma.fCMToken.update({
        where: { id: existingToken.id },
        data: {
          deviceType: data.deviceType as any,
          isActive: true,
          updatedAt: new Date(),
        },
      });

      return updatedToken as FCMToken;
    }

    // Create new token
    const newToken = await prisma.fCMToken.create({
      data: {
        tenantId,
        userId,
        token: data.token,
        deviceType: data.deviceType as any,
        isActive: true,
      },
    });

    return newToken as FCMToken;
  }

  async unregisterToken(tenantId: string, userId: string, token: string): Promise<void> {
    await prisma.fCMToken.deleteMany({
      where: {
        userId,
        token,
        tenantId,
      },
    });
  }

  async getUserTokens(tenantId: string, userId: string): Promise<FCMToken[]> {
    const tokens = await prisma.fCMToken.findMany({
      where: {
        userId,
        tenantId,
        isActive: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return tokens as FCMToken[];
  }

  // ============================================
  // NOTIFICATION SENDING
  // ============================================

  async sendNotification(tokens: string[], notification: FCMNotification): Promise<FCMNotificationResult> {
    if (!this.isEnabled() || !this.app) {
      return {
        success: false,
        successCount: 0,
        failureCount: tokens.length,
        errors: ['Firebase FCM not enabled or not initialized'],
      };
    }

    if (tokens.length === 0) {
      return {
        success: true,
        successCount: 0,
        failureCount: 0,
        errors: [],
      };
    }

    const message: admin.messaging.MulticastMessage = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data,
      tokens: tokens,
    };

    try {
      const response = await this.app.messaging().sendMulticast(message);

      const result: FCMNotificationResult = {
        success: response.successCount > 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
        errors: [],
      };

      // Log failed tokens for cleanup
      if (response.responses) {
        response.responses.forEach((resp, index) => {
          if (!resp.success) {
            result.errors.push(`Token ${index}: ${resp.error?.message || 'Unknown error'}`);
            
            // Deactivate invalid tokens
            if (resp.error?.code === 'messaging/registration-token-not-registered' ||
                resp.error?.code === 'messaging/invalid-registration-token') {
              this.deactivateToken(tokens[index]);
            }
          }
        });
      }

      return result;
    } catch (error) {
      Logger.error('Error sending FCM notification:', error);
      return {
        success: false,
        successCount: 0,
        failureCount: tokens.length,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  async sendNotificationToUser(tenantId: string, userId: string, notification: FCMNotification): Promise<FCMNotificationResult> {
    const tokens = await this.getUserTokens(tenantId, userId);
    const tokenStrings = tokens.map(t => t.token);

    return this.sendNotification(tokenStrings, notification);
  }

  private async deactivateToken(token: string): Promise<void> {
    try {
      await prisma.fCMToken.updateMany({
        where: { token },
        data: { isActive: false },
      });
    } catch (error) {
      Logger.error('Error deactivating token:', error);
    }
  }

  // ============================================
  // BOOKING NOTIFICATIONS
  // ============================================

  async sendBookingAssignment(data: BookingAssignmentNotification): Promise<FCMNotificationResult> {
    const notification: FCMNotification = {
      title: '🔧 حجز جديد',
      body: `حجز جديد للعميل ${data.customerName} - ${data.vehicleMake} ${data.vehicleModel}`,
      data: {
        type: 'BOOKING_ASSIGNMENT',
        bookingId: data.bookingId,
        customerName: data.customerName,
        vehicleMake: data.vehicleMake,
        vehicleModel: data.vehicleModel,
        scheduledDate: data.scheduledDate,
        priority: data.priority,
      },
    };

    return this.sendNotificationToUser('default', data.mechanicUserId, notification);
  }

  async sendBookingStatusUpdate(data: BookingStatusNotification): Promise<FCMNotificationResult> {
    const statusMessages: Record<string, string> = {
      'IN_PROGRESS': 'جاري العمل',
      'WAITING_PARTS': 'ننتظر قطع الغيار',
      'READY': 'جاهز للاستلام',
      'COMPLETED': 'مكتمل',
      'CANCELLED': 'ملغي',
    };

    const statusMessage = statusMessages[data.status] || data.status;

    const notification: FCMNotification = {
      title: '📋 تحديث الحجز',
      body: `حجز ${data.customerName} - ${data.vehicleMake} ${data.vehicleModel}: ${statusMessage}`,
      data: {
        type: 'BOOKING_STATUS_UPDATE',
        bookingId: data.bookingId,
        status: data.status,
        customerName: data.customerName,
        vehicleMake: data.vehicleMake,
        vehicleModel: data.vehicleModel,
      },
    };

    return this.sendNotificationToUser('default', data.mechanicUserId, notification);
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isEnabled()) {
      return { success: false, message: 'Firebase FCM not enabled or not configured' };
    }

    if (!this.app) {
      return { success: false, message: 'Firebase app not initialized' };
    }

    try {
      // Send a test notification to check if Firebase is working
      const testNotification: FCMNotification = {
        title: 'Test Notification',
        body: 'This is a test notification from Garage Go',
        data: { type: 'TEST' },
      };

      // We can't actually send without a valid token, so just check if app is initialized
      return { success: true, message: 'Firebase FCM is initialized and ready' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
      };
    }
  }
}