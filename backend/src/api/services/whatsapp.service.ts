import prisma from '../../config/database';
import { Logger } from '../../infrastructure/logging/logger';
import { renderTemplate } from './whatsapp-templates';

export class WhatsAppService {
  async sendWhatsAppMessage(
    tenantId: string,
    phoneNumber: string,
    templateName: string,
    variables: Record<string, string>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Check if WhatsApp notifications are enabled
      const settings = await prisma.companySettings.findUnique({
        where: { tenantId },
        select: {
          enableWhatsAppNotifications: true,
          whatsappPhoneNumberId: true,
          whatsappAccessToken: true,
          whatsappBusinessAccountId: true,
        },
      });

      if (!settings || !settings.enableWhatsAppNotifications) {
        Logger.debug('WhatsApp notifications disabled for tenant', { tenantId });
        return { success: false, error: 'WhatsApp notifications disabled' };
      }

      if (!settings.whatsappAccessToken || !settings.whatsappPhoneNumberId) {
        Logger.debug('WhatsApp credentials not configured for tenant', { tenantId });
        return { success: false, error: 'WhatsApp credentials not configured' };
      }

      // Render the message template
      const message = renderTemplate(templateName, variables);

      // Log the message to database
      const whatsappMessage = await prisma.whatsAppMessage.create({
        data: {
          tenantId,
          phoneNumber,
          message,
          status: 'PENDING',
        },
      });

      // Send via WhatsApp Cloud API
      const response = await this.sendToWhatsAppCloudAPI(
        settings.whatsappPhoneNumberId,
        settings.whatsappAccessToken,
        phoneNumber,
        message
      );

      if (response.success) {
        await prisma.whatsAppMessage.update({
          where: { id: whatsappMessage.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
          },
        });
        return { success: true, messageId: whatsappMessage.id };
      } else {
        await prisma.whatsAppMessage.update({
          where: { id: whatsappMessage.id },
          data: {
            status: 'FAILED',
            error: response.error,
          },
        });
        return { success: false, error: response.error };
      }
    } catch (error) {
      Logger.error('Send WhatsApp message error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  private async sendToWhatsAppCloudAPI(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    message: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: {
            body: message,
          },
        }),
      });

      const data = await response.json() as any;

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.error?.message || 'Failed to send message' };
      }
    } catch (error) {
      Logger.error('WhatsApp Cloud API error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async getWhatsAppMessages(tenantId: string, limit: number = 50) {
    return prisma.whatsAppMessage.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // Booking Notifications
  async sendBookingCreated(tenantId: string, phoneNumber: string, bookingId: string) {
    return this.sendWhatsAppMessage(tenantId, phoneNumber, 'booking_created', { bookingId });
  }

  async sendBookingApproved(tenantId: string, phoneNumber: string, date: string, time: string) {
    return this.sendWhatsAppMessage(tenantId, phoneNumber, 'booking_approved', { date, time });
  }

  async sendBookingCancelled(tenantId: string, phoneNumber: string, bookingId: string, phone: string) {
    return this.sendWhatsAppMessage(tenantId, phoneNumber, 'booking_cancelled', { bookingId, phone });
  }

  async sendTechnicianAssigned(tenantId: string, phoneNumber: string, technicianName: string) {
    return this.sendWhatsAppMessage(tenantId, phoneNumber, 'technician_assigned', { technicianName });
  }

  async sendEstimatedStartTime(tenantId: string, phoneNumber: string, date: string, time: string) {
    return this.sendWhatsAppMessage(tenantId, phoneNumber, 'estimated_start_time', { date, time });
  }

  async sendEstimatedCompletionTime(tenantId: string, phoneNumber: string, date: string, time: string) {
    return this.sendWhatsAppMessage(tenantId, phoneNumber, 'estimated_completion_time', { date, time });
  }

  // Service Progress Notifications
  async sendWorkStarted(tenantId: string, phoneNumber: string, technicianName: string) {
    return this.sendWhatsAppMessage(tenantId, phoneNumber, 'work_started', { technicianName });
  }

  async sendWorkCompleted(tenantId: string, phoneNumber: string) {
    return this.sendWhatsAppMessage(tenantId, phoneNumber, 'work_completed', {});
  }

  async sendFaultDiscovered(tenantId: string, phoneNumber: string, faultTitle: string) {
    return this.sendWhatsAppMessage(tenantId, phoneNumber, 'fault_discovered', { faultTitle });
  }

  async sendFaultApproved(tenantId: string, phoneNumber: string, faultTitle: string) {
    return this.sendWhatsAppMessage(tenantId, phoneNumber, 'fault_approved', { faultTitle });
  }

  async sendFaultRejected(tenantId: string, phoneNumber: string, faultTitle: string) {
    return this.sendWhatsAppMessage(tenantId, phoneNumber, 'fault_rejected', { faultTitle });
  }

  // Invoice Notifications
  async sendInvoiceReady(tenantId: string, phoneNumber: string, total: string, invoiceUrl: string) {
    return this.sendWhatsAppMessage(tenantId, phoneNumber, 'invoice_ready', { total, invoiceUrl });
  }

  async sendPaymentReceived(tenantId: string, phoneNumber: string, amount: string) {
    return this.sendWhatsAppMessage(tenantId, phoneNumber, 'payment_received', { amount });
  }

  // Vehicle Maintenance Notifications
  async sendNextServiceDue(tenantId: string, phoneNumber: string) {
    return this.sendWhatsAppMessage(tenantId, phoneNumber, 'next_service_due', {});
  }

  async sendRecommendationDue(tenantId: string, phoneNumber: string, serviceName: string) {
    return this.sendWhatsAppMessage(tenantId, phoneNumber, 'recommendation_due', { serviceName });
  }

  // Inventory Notifications (internal)
  async sendLowStockAlert(tenantId: string, phoneNumber: string, partName: string, quantity: string) {
    return this.sendWhatsAppMessage(tenantId, phoneNumber, 'low_stock_alert', { partName, quantity });
  }

  async sendPurchaseOrderReceived(tenantId: string, phoneNumber: string, orderNumber: string, supplierName: string) {
    return this.sendWhatsAppMessage(tenantId, phoneNumber, 'purchase_order_received', { orderNumber, supplierName });
  }

  // Membership Notifications
  async sendMembershipPurchased(tenantId: string, phoneNumber: string, planName: string, endDate: string) {
    return this.sendWhatsAppMessage(tenantId, phoneNumber, 'membership_purchased', { planName, endDate });
  }

  async sendMembershipExpiring(tenantId: string, phoneNumber: string, planName: string, endDate: string) {
    return this.sendWhatsAppMessage(tenantId, phoneNumber, 'membership_expiring', { planName, endDate });
  }

  async sendMembershipExpired(tenantId: string, phoneNumber: string, planName: string) {
    return this.sendWhatsAppMessage(tenantId, phoneNumber, 'membership_expired', { planName });
  }

  // Loyalty Points Notifications
  async sendPointsEarned(tenantId: string, phoneNumber: string, points: number) {
    return this.sendWhatsAppMessage(tenantId, phoneNumber, 'points_earned', { points: points.toString() });
  }

  async sendPointsRedeemed(tenantId: string, phoneNumber: string, points: number) {
    return this.sendWhatsAppMessage(tenantId, phoneNumber, 'points_redeemed', { points: points.toString() });
  }
}
