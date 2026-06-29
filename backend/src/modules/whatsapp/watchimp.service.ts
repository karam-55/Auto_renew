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
  userId?: string;
  businessAccountId?: string;
  phoneNumberId: string;
  accessToken?: string;
  appId?: string;
  isEnabled: boolean;
}

export class WatchimpService {
  private config: WatchimpConfig;
  private io: SocketIOServer | null = null;

  constructor() {
    this.config = {
      apiKey: process.env.WATCHIMP_API_KEY || '',
      apiUrl: process.env.WATCHIMP_API_URL || 'https://app.whatchimp.com/api/v1',
      userId: process.env.WATCHIMP_USER_ID,
      businessAccountId: process.env.WATCHIMP_BUSINESS_ACCOUNT_ID,
      phoneNumberId: process.env.WATCHIMP_PHONE_NUMBER_ID || '',
      accessToken: process.env.WATCHIMP_ACCESS_TOKEN,
      appId: process.env.WATCHIMP_APP_ID,
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
           !!this.config.phoneNumberId;
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
        `${this.config.apiUrl}/whatsapp/send`,
        {
          apiToken: this.config.apiKey,
          phone_number_id: this.config.phoneNumberId,
          message: message.message,
          phone_number: phone,
        },
        {
          timeout: 8000,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      Logger.debug('Watchimp message sent successfully', { messageId: response.data?.wa_message_id });
      return {
        success: response.data?.status === '1' || response.data?.status === 1,
        messageId: response.data?.wa_message_id,
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

  /**
   * Send a PDF document via WhatsApp
   */
  async sendDocument(
    to: string,
    documentUrl: string,
    caption: string = '',
    filename: string = 'document.pdf'
  ): Promise<WhatsAppNotificationResult> {
    if (!this.isEnabled()) {
      return { success: false, error: 'Watchimp not enabled' };
    }

    const phone = this.normalizePhone(to);

    try {
      const response = await axios.post(
        `${this.config.apiUrl}/whatsapp/send-document`,
        {
          apiToken: this.config.apiKey,
          phone_number_id: this.config.phoneNumberId,
          phone_number: phone,
          document_url: documentUrl,
          caption: caption,
          filename: filename,
        },
        {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      Logger.debug('Watchimp document sent successfully', { messageId: response.data?.wa_message_id });
      return {
        success: response.data?.status === '1' || response.data?.status === 1,
        messageId: response.data?.wa_message_id,
      };
    } catch (error) {
      Logger.error('Error sending Watchimp document', error);
      return { success: false, error: this.extractError(error) };
    }
  }

  /**
   * Send invoice PDF to customer
   */
  async sendInvoicePdf(
    customerPhone: string,
    invoicePdfUrl: string,
    invoiceNumber: string,
    totalAmount: number
  ): Promise<WhatsAppNotificationResult> {
    const caption = `فاتورتك رقم ${invoiceNumber} - الإجمالي: ${totalAmount.toLocaleString()} ل.س`;
    const filename = `invoice_${invoiceNumber}.pdf`;
    return this.sendDocument(customerPhone, invoicePdfUrl, caption, filename);
  }

  async sendBookingConfirmation(data: BookingNotificationData): Promise<WhatsAppNotificationResult> {
    const components = [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: data.customerName },
          { type: 'text', text: data.garageName },
          { type: 'text', text: data.bookingId },
          { type: 'text', text: `${data.vehicleMake} ${data.vehicleModel}` },
          { type: 'text', text: data.scheduledDate },
        ],
      },
    ];
    return this.sendTemplateMessage(data.customerPhone, 'booking_confirmation', 'ar', components);
  }

  async sendBookingStatusUpdate(data: BookingNotificationData): Promise<WhatsAppNotificationResult> {
    const statusMessages: Record<string, string> = {
      'IN_PROGRESS': 'جاري العمل',
      'WAITING_PARTS': 'بانتظار قطع الغيار',
      'READY': 'جاهز للاستلام',
      'COMPLETED': 'مكتمل',
      'CANCELLED': 'ملغى',
    };
    const statusText = statusMessages[data.status] || data.status;
    const components = [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: data.customerName },
          { type: 'text', text: data.garageName },
          { type: 'text', text: data.bookingId },
          { type: 'text', text: statusText },
          { type: 'text', text: `${data.vehicleMake} ${data.vehicleModel}` },
        ],
      },
    ];
    return this.sendTemplateMessage(data.customerPhone, 'booking_status_updatee', 'ar', components);
  }

  async sendInstallmentReminder(data: InstallmentReminderData): Promise<WhatsAppNotificationResult> {
    const components = [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: data.customerName },
          { type: 'text', text: data.garageName },
          { type: 'text', text: String(data.installmentAmount) },
          { type: 'text', text: data.dueDate },
          { type: 'text', text: data.invoiceNumber },
        ],
      },
    ];
    return this.sendTemplateMessage(data.customerPhone, 'installment_reminder', 'ar', components);
  }

  async sendInstallmentOverdue(data: InstallmentReminderData): Promise<WhatsAppNotificationResult> {
    const components = [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: data.customerName },
          { type: 'text', text: data.garageName },
          { type: 'text', text: String(data.installmentAmount) },
          { type: 'text', text: data.dueDate },
          { type: 'text', text: data.invoiceNumber },
        ],
      },
    ];
    return this.sendTemplateMessage(data.customerPhone, 'installment_overdue', 'ar', components);
  }

  async sendInvoiceNotification(data: InvoiceNotificationData): Promise<WhatsAppNotificationResult> {
    const components = [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: data.customerName },
          { type: 'text', text: data.garageName },
          { type: 'text', text: data.invoiceNumber },
          { type: 'text', text: String(data.totalAmount) },
          { type: 'text', text: data.dueDate },
        ],
      },
    ];
    return this.sendTemplateMessage(data.customerPhone, 'invoice_new', 'ar', components);
  }

  async sendPaymentConfirmation(data: InvoiceNotificationData): Promise<WhatsAppNotificationResult> {
    const components = [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: data.customerName },
          { type: 'text', text: data.garageName },
          { type: 'text', text: data.invoiceNumber },
          { type: 'text', text: String(data.totalAmount) },
        ],
      },
    ];
    return this.sendTemplateMessage(data.customerPhone, 'payment_received', 'ar', components);
  }

  async sendLoyaltyPointsEarned(
    customerName: string,
    customerPhone: string,
    points: number,
    garageName: string
  ): Promise<WhatsAppNotificationResult> {
    const components = [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: customerName },
          { type: 'text', text: garageName },
          { type: 'text', text: String(points) },
        ],
      },
    ];
    return this.sendTemplateMessage(customerPhone, 'loyalty_pointss', 'ar', components);
  }

  async sendLoyaltyTierUpgrade(
    customerName: string,
    customerPhone: string,
    newTier: string,
    garageName: string
  ): Promise<WhatsAppNotificationResult> {
    const components = [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: customerName },
          { type: 'text', text: newTier },
          { type: 'text', text: garageName },
        ],
      },
    ];
    return this.sendTemplateMessage(customerPhone, 'loyalty_upgrade', 'ar', components);
  }

  async sendWelcomeMessage(
    customerName: string,
    customerPhone: string,
    garageName: string
  ): Promise<WhatsAppNotificationResult> {
    const components = [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: customerName },
          { type: 'text', text: garageName },
        ],
      },
    ];
    return this.sendTemplateMessage(customerPhone, 'welcome', 'ar', components);
  }

  async sendWarrantyNotification(data: {
    customerName: string;
    customerPhone: string;
    warrantyNumber: string;
    expiryDate: string;
    garageName: string;
  }): Promise<WhatsAppNotificationResult> {
    const components = [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: data.customerName },
          { type: 'text', text: data.garageName },
          { type: 'text', text: data.warrantyNumber },
          { type: 'text', text: data.expiryDate },
        ],
      },
    ];
    return this.sendTemplateMessage(data.customerPhone, 'warranty_new', 'ar', components);
  }

  async checkConnection(): Promise<WhatsAppNotificationResult> {
    if (!this.isEnabled()) {
      return { success: false, message: 'Watchimp not enabled or not configured' };
    }

    // If we have all connection credentials, try to verify account connection
    if (this.config.userId && this.config.businessAccountId && this.config.accessToken) {
      try {
        const result = await this.connectAccount();
        if (result.success) {
          return { success: true, message: 'Watchimp account connected successfully' };
        }
        return { success: false, message: result.error || 'Watchimp connection failed' };
      } catch (error) {
        return { success: false, message: this.extractError(error) };
      }
    }

    // Otherwise, sending configuration is ready
    return { success: true, message: 'Watchimp sending configuration is ready' };
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
