import prisma from '../../config/database';
import { Logger } from '../../infrastructure/logging/logger';
import settingsService from '../../services/settings.service';

/**
 * WhatsApp Notification Service
 * Manages WhatsApp message notifications
 * 
 * Uses WhatsApp Business API to send messages to customers
 */

export interface WhatsAppMessage {
  id: string;
  tenantId: string;
  phoneNumber: string;
  message: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  sentAt?: Date;
  deliveredAt?: Date;
  error?: string;
  createdAt: Date;
}

export class WhatsAppNotificationService {
  /**
   * Send WhatsApp message
   */
  async sendMessage(
    tenantId: string,
    phoneNumber: string,
    message: string
  ): Promise<WhatsAppMessage> {
    // Check if WhatsApp notifications are enabled
    try {
      const settings = await settingsService.getSettings(tenantId);
      if (!settings.enableWhatsAppNotifications) {
        Logger.debug('WhatsApp notifications are disabled for tenant', { tenantId });
        // Return a mock message with status indicating it was skipped
        return {
          id: 'skipped',
          tenantId,
          phoneNumber,
          message,
          status: 'FAILED',
          error: 'WhatsApp notifications disabled',
          createdAt: new Date(),
        } as WhatsAppMessage;
      }
    } catch (error) {
      Logger.error('Failed to check settings, proceeding with send attempt:', error);
    }

    // Create WhatsApp message record
    const whatsappMessage = await prisma.whatsAppMessage.create({
      data: {
        tenantId,
        phoneNumber,
        message,
        status: 'PENDING'
      }
    });

    // In a real implementation, call WhatsApp Business API here
    // For now, simulate sending
    const sent = await this.sendToWhatsAppAPI(phoneNumber, message);

    if (sent) {
      await prisma.whatsAppMessage.update({
        where: { id: whatsappMessage.id },
        data: {
          status: 'SENT',
          sentAt: new Date()
        }
      });
    } else {
      await prisma.whatsAppMessage.update({
        where: { id: whatsappMessage.id },
        data: {
          status: 'FAILED',
          error: 'Failed to send via WhatsApp API'
        }
      });
    }

    const updated = await prisma.whatsAppMessage.findUnique({
      where: { id: whatsappMessage.id }
    });

    return {
      id: updated!.id,
      tenantId: updated!.tenantId,
      phoneNumber: updated!.phoneNumber,
      message: updated!.message,
      status: updated!.status as any,
      sentAt: updated!.sentAt || undefined,
      deliveredAt: updated!.deliveredAt || undefined,
      error: updated!.error || undefined,
      createdAt: updated!.createdAt
    };
  }

  /**
   * Send message via WhatsApp API (simulated)
   */
  private async sendToWhatsAppAPI(
    phoneNumber: string,
    message: string
  ): Promise<boolean> {
    // In a real implementation, integrate with WhatsApp Business API
    // For now, return true to simulate success
    return true;
  }

  /**
   * Send booking confirmation via WhatsApp
   */
  async sendBookingConfirmation(
    tenantId: string,
    phoneNumber: string,
    bookingNumber: string,
    scheduledDate: string
  ): Promise<WhatsAppMessage> {
    const message = `Your booking ${bookingNumber} has been confirmed for ${scheduledDate}. Thank you for choosing our service!`;

    return await this.sendMessage(
      tenantId,
      phoneNumber,
      message
    );
  }

  /**
   * Send payment reminder via WhatsApp
   */
  async sendPaymentReminder(
    tenantId: string,
    phoneNumber: string,
    invoiceNumber: string,
    amount: number,
    currency: string,
    dueDate: string
  ): Promise<WhatsAppMessage> {
    const message = `Reminder: Invoice ${invoiceNumber} for ${amount} ${currency} is due on ${dueDate}. Please complete your payment.`;

    return await this.sendMessage(
      tenantId,
      phoneNumber,
      message
    );
  }

  /**
   * Send service completion notification via WhatsApp
   */
  async sendServiceCompletion(
    tenantId: string,
    phoneNumber: string,
    bookingNumber: string,
    serviceName: string
  ): Promise<WhatsAppMessage> {
    const message = `Your vehicle service (${serviceName}) for booking ${bookingNumber} has been completed. You can pick up your vehicle now.`;

    return await this.sendMessage(
      tenantId,
      phoneNumber,
      message
    );
  }

  /**
   * Get WhatsApp messages for a tenant
   */
  async getTenantMessages(
    tenantId: string,
    limit: number = 50
  ): Promise<WhatsAppMessage[]> {
    const messages = await prisma.whatsAppMessage.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return messages.map(m => ({
      id: m.id,
      tenantId: m.tenantId,
      phoneNumber: m.phoneNumber,
      message: m.message,
      status: m.status as any,
      sentAt: m.sentAt || undefined,
      deliveredAt: m.deliveredAt || undefined,
      error: m.error || undefined,
      createdAt: m.createdAt
    }));
  }

  /**
   * Get WhatsApp message by ID
   */
  async getMessage(messageId: string): Promise<WhatsAppMessage | null> {
    const message = await prisma.whatsAppMessage.findUnique({
      where: { id: messageId }
    });

    if (!message) return null;

    return {
      id: message.id,
      tenantId: message.tenantId,
      phoneNumber: message.phoneNumber,
      message: message.message,
      status: message.status as any,
      sentAt: message.sentAt || undefined,
      deliveredAt: message.deliveredAt || undefined,
      error: message.error || undefined,
      createdAt: message.createdAt
    };
  }

  /**
   * Get WhatsApp summary for dashboard
   */
  async getWhatsAppSummary(tenantId: string): Promise<{
    totalMessages: number;
    sentMessages: number;
    failedMessages: number;
    pendingMessages: number;
  }> {
    const totalMessages = await prisma.whatsAppMessage.count({
      where: { tenantId }
    });

    const sentMessages = await prisma.whatsAppMessage.count({
      where: { tenantId, status: 'SENT' }
    });

    const failedMessages = await prisma.whatsAppMessage.count({
      where: { tenantId, status: 'FAILED' }
    });

    const pendingMessages = await prisma.whatsAppMessage.count({
      where: { tenantId, status: 'PENDING' }
    });

    return {
      totalMessages,
      sentMessages,
      failedMessages,
      pendingMessages
    };
  }
}

export default new WhatsAppNotificationService();
