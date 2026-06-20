import { Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { InAppNotificationService } from './in-app-notification.service';
import { WhatsAppNotificationService } from './whatsapp-notification.service';

/**
 * Notification Rules Service
 * Manages notification rules and triggers
 * 
 * Automatically sends notifications based on business events
 */

export interface NotificationRule {
  id: string;
  tenantId: string;
  name: string;
  nameAr?: string;
  eventType: 'BOOKING_CREATED' | 'BOOKING_UPDATED' | 'BOOKING_COMPLETED' | 'INVOICE_CREATED' | 'PAYMENT_RECEIVED' | 'PAYMENT_OVERDUE' | 'SERVICE_COMPLETED' | 'CUSTOMER_REGISTERED' | 'GRN_COMPLETED';
  channels: ('IN_APP' | 'WHATSAPP')[];
  isActive: boolean;
  conditions?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class NotificationRulesService {
  private inAppService = new InAppNotificationService();
  private whatsappService = new WhatsAppNotificationService();

  /**
   * Create a notification rule
   */
  async createRule(
    tenantId: string,
    name: string,
    nameAr: string | undefined,
    eventType: 'BOOKING_CREATED' | 'BOOKING_UPDATED' | 'BOOKING_COMPLETED' | 'INVOICE_CREATED' | 'PAYMENT_RECEIVED' | 'PAYMENT_OVERDUE' | 'SERVICE_COMPLETED' | 'CUSTOMER_REGISTERED' | 'GRN_COMPLETED',
    channels: ('IN_APP' | 'WHATSAPP')[],
    conditions: Record<string, any> | undefined
  ): Promise<NotificationRule> {
    const rule = await prisma.notificationRule.create({
      data: {
        tenantId,
        name,
        nameAr,
        eventType,
        channels,
        conditions: conditions ? JSON.stringify(conditions) : Prisma.JsonNull,
        isActive: true
      }
    });

    return {
      id: rule.id,
      tenantId: rule.tenantId,
      name: rule.name,
      nameAr: rule.nameAr || undefined,
      eventType: rule.eventType as any,
      channels: rule.channels as any,
      isActive: rule.isActive,
      conditions: rule.conditions ? JSON.parse(rule.conditions as string) : undefined,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt
    };
  }

  /**
   * Get active rules for an event type
   */
  async getActiveRules(
    tenantId: string,
    eventType: string
  ): Promise<NotificationRule[]> {
    const rules = await prisma.notificationRule.findMany({
      where: {
        tenantId,
        eventType,
        isActive: true
      }
    });

    return rules.map((r: any) => ({
      id: r.id,
      tenantId: r.tenantId,
      name: r.name,
      nameAr: r.nameAr || undefined,
      eventType: r.eventType as any,
      channels: r.channels as any,
      isActive: r.isActive,
      conditions: r.conditions ? JSON.parse(r.conditions as string) : undefined,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    }));
  }

  /**
   * Trigger notification based on event
   */
  async triggerEvent(
    tenantId: string,
    eventType: string,
    data: Record<string, any>
  ): Promise<void> {
    const rules = await this.getActiveRules(tenantId, eventType);

    for (const rule of rules) {
      if (!rule.isActive) continue;

      // Check conditions if any
      if (rule.conditions && !this.checkConditions(rule.conditions, data)) {
        continue;
      }

      // Send notifications through configured channels
      for (const channel of rule.channels) {
        await this.sendNotification(channel, eventType, data, tenantId);
      }
    }
  }

  /**
   * Check if conditions are met
   */
  private checkConditions(conditions: Record<string, any>, data: Record<string, any>): boolean {
    // Simple condition checking - can be expanded
    for (const [key, value] of Object.entries(conditions)) {
      if (data[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Send notification through specific channel
   */
  private async sendNotification(
    channel: 'IN_APP' | 'WHATSAPP',
    eventType: string,
    data: Record<string, any>,
    tenantId: string
  ): Promise<void> {
    switch (eventType) {
      case 'BOOKING_CREATED':
        await this.handleBookingCreated(channel, data, tenantId);
        break;
      case 'BOOKING_UPDATED':
        await this.handleBookingUpdated(channel, data, tenantId);
        break;
      case 'BOOKING_COMPLETED':
        await this.handleBookingCompleted(channel, data, tenantId);
        break;
      case 'INVOICE_CREATED':
        await this.handleInvoiceCreated(channel, data, tenantId);
        break;
      case 'PAYMENT_RECEIVED':
        await this.handlePaymentReceived(channel, data, tenantId);
        break;
      case 'PAYMENT_OVERDUE':
        await this.handlePaymentOverdue(channel, data, tenantId);
        break;
      case 'SERVICE_COMPLETED':
        await this.handleServiceCompleted(channel, data, tenantId);
        break;
      case 'CUSTOMER_REGISTERED':
        await this.handleCustomerRegistered(channel, data, tenantId);
        break;
      case 'GRN_COMPLETED':
        await this.handleGRNCompleted(channel, data, tenantId);
        break;
    }
  }

  /**
   * Handle booking created event
   */
  private async handleBookingCreated(
    channel: 'IN_APP' | 'WHATSAPP',
    data: Record<string, any>,
    tenantId: string
  ): Promise<void> {
    const { userId, phoneNumber, bookingNumber, scheduledDate } = data;

    if (channel === 'IN_APP' && userId) {
      await this.inAppService.createBookingNotification(
        tenantId,
        userId,
        bookingNumber,
        scheduledDate,
        'CONFIRMED'
      );
    }

    if (channel === 'WHATSAPP' && phoneNumber) {
      await this.whatsappService.sendBookingConfirmation(
        tenantId,
        phoneNumber,
        bookingNumber,
        scheduledDate
      );
    }
  }

  /**
   * Handle booking updated event
   */
  private async handleBookingUpdated(
    channel: 'IN_APP' | 'WHATSAPP',
    data: Record<string, any>,
    tenantId: string
  ): Promise<void> {
    const { userId, bookingNumber, status } = data;

    if (channel === 'IN_APP' && userId) {
      await this.inAppService.createBookingNotification(
        tenantId,
        userId,
        bookingNumber,
        new Date().toISOString().split('T')[0],
        status
      );
    }
  }

  /**
   * Handle booking completed event
   */
  private async handleBookingCompleted(
    channel: 'IN_APP' | 'WHATSAPP',
    data: Record<string, any>,
    tenantId: string
  ): Promise<void> {
    const { userId, phoneNumber, bookingNumber, serviceName } = data;

    if (channel === 'IN_APP' && userId) {
      await this.inAppService.createSystemNotification(
        tenantId,
        userId,
        `Booking ${bookingNumber} Completed`,
        `تم إكمال الحجز ${bookingNumber}`,
        `Your booking has been completed successfully.`,
        `تم إكمال حجزك بنجاح.`
      );
    }

    if (channel === 'WHATSAPP' && phoneNumber) {
      await this.whatsappService.sendServiceCompletion(
        tenantId,
        phoneNumber,
        bookingNumber,
        serviceName
      );
    }
  }

  /**
   * Handle invoice created event
   */
  private async handleInvoiceCreated(
    channel: 'IN_APP' | 'WHATSAPP',
    data: Record<string, any>,
    tenantId: string
  ): Promise<void> {
    const { userId, invoiceNumber, amount, currency } = data;

    if (channel === 'IN_APP' && userId) {
      await this.inAppService.createSystemNotification(
        tenantId,
        userId,
        `Invoice ${invoiceNumber} Created`,
        `تم إنشاء الفاتورة ${invoiceNumber}`,
        `A new invoice has been created for ${amount} ${currency}.`,
        `تم إنشاء فاتورة جديدة بقيمة ${amount} ${currency}.`
      );
    }
  }

  /**
   * Handle payment received event
   */
  private async handlePaymentReceived(
    channel: 'IN_APP' | 'WHATSAPP',
    data: Record<string, any>,
    tenantId: string
  ): Promise<void> {
    const { userId, invoiceId, invoiceNumber, amount, currency } = data;

    if (channel === 'IN_APP' && userId) {
      await this.inAppService.createPaymentNotification(
        tenantId,
        userId,
        invoiceId,
        invoiceNumber,
        amount,
        currency
      );
    }
  }

  /**
   * Handle payment overdue event
   */
  private async handlePaymentOverdue(
    channel: 'IN_APP' | 'WHATSAPP',
    data: Record<string, any>,
    tenantId: string
  ): Promise<void> {
    const { userId, phoneNumber, invoiceNumber, amount, currency, dueDate } = data;

    if (channel === 'IN_APP' && userId) {
      await this.inAppService.createSystemNotification(
        tenantId,
        userId,
        `Payment Overdue: ${invoiceNumber}`,
        `دفع متأخر: ${invoiceNumber}`,
        `Invoice ${invoiceNumber} for ${amount} ${currency} is overdue.`,
        `الفاتورة ${invoiceNumber} بقيمة ${amount} ${currency} متأخرة.`
      );
    }

    if (channel === 'WHATSAPP' && phoneNumber) {
      await this.whatsappService.sendPaymentReminder(
        tenantId,
        phoneNumber,
        invoiceNumber,
        amount,
        currency,
        dueDate
      );
    }
  }

  /**
   * Handle service completed event
   */
  private async handleServiceCompleted(
    channel: 'IN_APP' | 'WHATSAPP',
    data: Record<string, any>,
    tenantId: string
  ): Promise<void> {
    const { userId, phoneNumber, bookingNumber, serviceName } = data;

    if (channel === 'IN_APP' && userId) {
      await this.inAppService.createSystemNotification(
        tenantId,
        userId,
        `Service Completed: ${serviceName}`,
        `تم إكمال الخدمة: ${serviceName}`,
        `Your vehicle service has been completed.`,
        `تم إكمال خدمة مركبتك.`
      );
    }

    if (channel === 'WHATSAPP' && phoneNumber) {
      await this.whatsappService.sendServiceCompletion(
        tenantId,
        phoneNumber,
        bookingNumber,
        serviceName
      );
    }
  }

  /**
   * Handle customer registered event
   */
  private async handleCustomerRegistered(
    channel: 'IN_APP' | 'WHATSAPP',
    data: Record<string, any>,
    tenantId: string
  ): Promise<void> {
    const { userId, customerName } = data;

    if (channel === 'IN_APP' && userId) {
      await this.inAppService.createSystemNotification(
        tenantId,
        userId,
        'Welcome to Our Service',
        'مرحباً بك في خدمتنا',
        `Thank you for registering, ${customerName}!`,
        `شكراً لتسجيلك، ${customerName}!`
      );
    }
  }

  /**
   * Handle GRN completed event
   */
  private async handleGRNCompleted(
    channel: 'IN_APP' | 'WHATSAPP',
    data: Record<string, any>,
    tenantId: string
  ): Promise<void> {
    const { userId, grnNumber, supplierName } = data;

    if (channel === 'IN_APP' && userId) {
      await this.inAppService.createSystemNotification(
        tenantId,
        userId,
        `GRN ${grnNumber} Completed`,
        `تم إكمال إيصال الاستلام ${grnNumber}`,
        `Goods Receipt Note ${grnNumber} for ${supplierName} has been completed.`,
        `تم إكمال إيصال الاستلام ${grnNumber} للمورد ${supplierName}.`
      );
    }
  }

  /**
   * Get notification rules summary
   */
  async getRulesSummary(tenantId: string): Promise<{
    totalRules: number;
    activeRules: number;
    rulesByEventType: Record<string, number>;
  }> {
    const rules = await this.getActiveRules(tenantId, '');
    const activeRules = rules.filter(r => r.isActive).length;

    const rulesByEventType: Record<string, number> = {};
    for (const rule of rules) {
      if (!rulesByEventType[rule.eventType]) {
        rulesByEventType[rule.eventType] = 0;
      }
      rulesByEventType[rule.eventType]++;
    }

    return {
      totalRules: rules.length,
      activeRules,
      rulesByEventType
    };
  }

  /**
   * Get all rules for tenant
   */
  async getRules(tenantId: string): Promise<NotificationRule[]> {
    const rules = await prisma.notificationRule.findMany({
      where: { tenantId }
    });

    return rules.map((r: any) => ({
      id: r.id,
      tenantId: r.tenantId,
      name: r.name,
      nameAr: r.nameAr || undefined,
      eventType: r.eventType as any,
      channels: r.channels as any,
      isActive: r.isActive,
      conditions: r.conditions ? JSON.parse(r.conditions as string) : undefined,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    }));
  }

  /**
   * Update rule
   */
  async updateRule(ruleId: string, updates: Partial<NotificationRule>): Promise<NotificationRule> {
    const { name, nameAr, channels, conditions, isActive } = updates;

    const rule = await prisma.notificationRule.update({
      where: { id: ruleId },
      data: {
        ...(name !== undefined && { name }),
        ...(nameAr !== undefined && { nameAr }),
        ...(channels !== undefined && { channels }),
        ...(conditions !== undefined && { conditions: conditions ? JSON.stringify(conditions) : Prisma.JsonNull }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return {
      id: rule.id,
      tenantId: rule.tenantId,
      name: rule.name,
      nameAr: rule.nameAr || undefined,
      eventType: rule.eventType as any,
      channels: rule.channels as any,
      isActive: rule.isActive,
      conditions: rule.conditions ? JSON.parse(rule.conditions as string) : undefined,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt
    };
  }

  /**
   * Delete rule
   */
  async deleteRule(ruleId: string): Promise<void> {
    await prisma.notificationRule.delete({
      where: { id: ruleId }
    });
  }
}

export default new NotificationRulesService();
