import axios from 'axios';
import { Server as SocketIOServer } from 'socket.io';
import {
  WhatsAppMessage,
  BookingNotificationData,
  InstallmentReminderData,
  InvoiceNotificationData,
  WhatsAppNotificationResult
} from './types';
import { Logger } from '../../infrastructure/logging/logger';

export interface WatchimpConfig {
  apiKey: string;
  apiUrl: string;
  userId: string;
  businessAccountId: string;
  phoneNumberId: string;
  accessToken: string;
  appId: string;
  isEnabled: boolean;
}

export class WatchimpService {
  private config: WatchimpConfig;
  private io: SocketIOServer | null = null;

  constructor() {
    this.config = {
      apiKey: process.env.WATCHIMP_API_KEY || '',
      apiUrl: process.env.WATCHIMP_API_URL || 'https://app.watchchimp.com/api/v1',
      userId: process.env.WATCHIMP_USER_ID || '',
      businessAccountId: process.env.WATCHIMP_BUSINESS_ACCOUNT_ID || '',
      phoneNumberId: process.env.WATCHIMP_PHONE_NUMBER_ID || '',
      accessToken: process.env.WATCHIMP_ACCESS_TOKEN || '',
      appId: process.env.WATCHIMP_APP_ID || '',
      isEnabled: process.env.WATCHIMP_ENABLED === 'true',
    };
  }

  setIo(io: SocketIOServer) {
    this.io = io;
  }

  updateConfig(config: Partial<WatchimpConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): WatchimpConfig {
    return { ...this.config };
  }

  isEnabled(): boolean {
    return this.config.isEnabled === true &&
           !!this.config.apiKey &&
           !!this.config.apiUrl &&
           !!this.config.userId &&
           !!this.config.businessAccountId &&
           !!this.config.phoneNumberId &&
           !!this.config.accessToken;
  }

  /**
   * Connect WhatsApp Business Account to Watchimp
   */
  async connectAccount(): Promise<WhatsAppNotificationResult> {
    if (!this.isEnabled()) {
      return { success: false, error: 'Watchimp not enabled or not configured' };
    }

    try {
      const response = await axios.post(
        `${this.config.apiUrl}/whatsapp/account/connect`,
        {
          apiToken: this.config.apiKey,
          user_id: this.config.userId,
          whatsapp_business_account_id: this.config.businessAccountId,
          access_token: this.config.accessToken,
        },
        {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      Logger.info('Watchimp account connected successfully', { data: response.data });
      return { success: true, messageId: response.data?.id?.toString() };
    } catch (error) {
      Logger.error('Error connecting Watchimp account', error);
      return { success: false, error: this.extractError(error) };
    }
  }

  /**
   * Send a free-form text message
   */
  async sendMessage(message: WhatsAppMessage): Promise<WhatsAppNotificationResult> {
    if (!this.isEnabled()) {
      Logger.debug('Watchimp is not enabled or not configured');
      return { success: false, error: 'Watchimp not enabled' };
    }

    const phone = this.normalizePhone(message.to);

    try {
      const response = await axios.post(
        `${this.config.apiUrl}/whatsapp/send-message`,
        {
          apiToken: this.config.apiKey,
          user_id: this.config.userId,
          whatsapp_business_account_id: this.config.businessAccountId,
          phone_number_id: this.config.phoneNumberId,
          access_token: this.config.accessToken,
          to: phone,
          type: 'text',
          text: {
            body: message.message,
          },
        },
        {
          timeout: 8000,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      Logger.debug('Watchimp message sent successfully', { messageId: response.data?.messages?.[0]?.id });
      return {
        success: true,
        messageId: response.data?.messages?.[0]?.id || response.data?.id?.toString(),
      };
    } catch (error) {
      Logger.error('Error sending Watchimp message', error);
      return { success: false, error: this.extractError(error) };
    }
  }

  /**
   * Send a templated message
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    language: string = 'ar',
    components: any[] = []
  ): Promise<WhatsAppNotificationResult> {
    if (!this.isEnabled()) {
      return { success: false, error: 'Watchimp not enabled' };
    }

    const phone = this.normalizePhone(to);

    try {
      const response = await axios.post(
        `${this.config.apiUrl}/whatsapp/send-template`,
        {
          apiToken: this.config.apiKey,
          user_id: this.config.userId,
          whatsapp_business_account_id: this.config.businessAccountId,
          phone_number_id: this.config.phoneNumberId,
          access_token: this.config.accessToken,
          to: phone,
          template: {
            name: templateName,
            language: {
              code: language,
            },
            components,
          },
        },
        {
          timeout: 8000,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      Logger.debug('Watchimp template sent successfully', { messageId: response.data?.messages?.[0]?.id });
      return {
        success: true,
        messageId: response.data?.messages?.[0]?.id || response.data?.id?.toString(),
      };
    } catch (error) {
      Logger.error('Error sending Watchimp template', error);
      return { success: false, error: this.extractError(error) };
    }
  }

  async sendBookingConfirmation(data: BookingNotificationData): Promise<WhatsAppNotificationResult> {
    const message = `مرحباً ${data.customerName}،\n\nتم استلام حجزك بنجاح في ${data.garageName}.\nرقم الحجز: ${data.bookingId}\nالمركبة: ${data.vehicleMake} ${data.vehicleModel}\nالتاريخ: ${data.scheduledDate}\n\nشكراً لثقتك بنا!`;
    return this.sendMessage({
      to: data.customerPhone,
      message,
    });
  }

  async sendBookingStatusUpdate(data: BookingNotificationData): Promise<WhatsAppNotificationResult> {
    const message = `مرحباً ${data.customerName}،\n\nتحديث حالة حجزك رقم ${data.bookingId}.\nالحالة الجديدة: ${data.status}\n\nشكراً لثقتك بنا!`;
    return this.sendMessage({
      to: data.customerPhone,
      message,
    });
  }

  async sendInstallmentReminder(data: InstallmentReminderData): Promise<WhatsAppNotificationResult> {
    const message = `مرحباً ${data.customerName}،\n\nتذكير بدفعة قسط بقيمة ${data.installmentAmount} ل.س\nمستحقة بتاريخ: ${data.dueDate}\nرقم الفاتورة: ${data.invoiceNumber}\n\nشكراً لك!`;
    return this.sendMessage({
      to: data.customerPhone,
      message,
    });
  }

  async sendInstallmentOverdue(data: InstallmentReminderData): Promise<WhatsAppNotificationResult> {
    const message = `مرحباً ${data.customerName}،\n\nتنبيه: دفعة قسط متأخرة بقيمة ${data.installmentAmount} ل.س\nكانت مستحقة بتاريخ: ${data.dueDate}\nرقم الفاتورة: ${data.invoiceNumber}\n\nيرجى التسديد في أقرب وقت.`;
    return this.sendMessage({
      to: data.customerPhone,
      message,
    });
  }

  async sendInvoiceNotification(data: InvoiceNotificationData): Promise<WhatsAppNotificationResult> {
    const message = `مرحباً ${data.customerName}،\n\nتم إصدار فاتورة جديدة رقم ${data.invoiceNumber}\nالإجمالي: ${data.totalAmount} ل.س\nتاريخ الاستحقاق: ${data.dueDate}\n\nشكراً لثقتك بنا!`;
    return this.sendMessage({
      to: data.customerPhone,
      message,
    });
  }

  async sendPaymentConfirmation(data: InvoiceNotificationData): Promise<WhatsAppNotificationResult> {
    const message = `مرحباً ${data.customerName}،\n\nتم استلام دفعة بقيمة ${data.totalAmount} ل.س\nرقم الفاتورة: ${data.invoiceNumber}\n\nشكراً لك!`;
    return this.sendMessage({
      to: data.customerPhone,
      message,
    });
  }

  async sendLoyaltyPointsEarned(
    customerName: string,
    customerPhone: string,
    points: number,
    garageName: string
  ): Promise<WhatsAppNotificationResult> {
    const message = `مرحباً ${customerName}،\n\nتم إضافة ${points} نقطة ولاء لحسابك في ${garageName}!\n\nشكراً لولائك المستمر.`;
    return this.sendMessage({
      to: customerPhone,
      message,
    });
  }

  async sendLoyaltyTierUpgrade(
    customerName: string,
    customerPhone: string,
    newTier: string,
    garageName: string
  ): Promise<WhatsAppNotificationResult> {
    const message = `مبروك ${customerName}!\n\nلقد تم ترقية حسابك إلى مستوى ${newTier} في ${garageName}.\nاستمتع بالمزايا الحصرية!`;
    return this.sendMessage({
      to: customerPhone,
      message,
    });
  }

  async sendWelcomeMessage(
    customerName: string,
    customerPhone: string,
    garageName: string
  ): Promise<WhatsAppNotificationResult> {
    const message = `مرحباً ${customerName}،\n\nأهلاً بك في ${garageName}!\nنحن هنا لخدمتك.\n\nلأي استفسار، تواصل معنا.`;
    return this.sendMessage({
      to: customerPhone,
      message,
    });
  }

  async sendWarrantyNotification(data: {
    customerName: string;
    customerPhone: string;
    warrantyNumber: string;
    expiryDate: string;
    garageName: string;
  }): Promise<WhatsAppNotificationResult> {
    const message = `مرحباً ${data.customerName}،\n\nضمانك رقم ${data.warrantyNumber} سينتهي بتاريخ ${data.expiryDate}.\nيرجى مراجعة ${data.garageName} للتجديد إذا رغبت.\n\nشكراً لك!`;
    return this.sendMessage({
      to: data.customerPhone,
      message,
    });
  }

  async checkConnection(): Promise<WhatsAppNotificationResult> {
    if (!this.isEnabled()) {
      return { success: false, message: 'Watchimp not enabled or not configured' };
    }

    try {
      const result = await this.connectAccount();
      if (result.success) {
        return { success: true, message: 'Watchimp connection is active' };
      }
      return { success: false, message: result.error || 'Watchimp connection failed' };
    } catch (error) {
      return { success: false, message: this.extractError(error) };
    }
  }

  private normalizePhone(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    if (!cleaned.startsWith('963') && cleaned.length === 9) {
      cleaned = '963' + cleaned;
    }
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    return cleaned;
  }

  private extractError(error: any): string {
    if (axios.isAxiosError(error)) {
      return error.response?.data?.message || error.response?.data?.error || error.message;
    }
    return error instanceof Error ? error.message : 'Unknown error';
  }
}

export default WatchimpService;
