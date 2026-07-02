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
    const apiKey = process.env.WATCHIMP_API_KEY || '';
    // Parse API key format: "user_id|access_token"
    const [parsedUserId, parsedAccessToken] = apiKey.includes('|')
      ? apiKey.split('|')
      : ['', apiKey];

    this.config = {
      apiKey,
      apiUrl: process.env.WATCHIMP_API_URL || 'https://app.whatchimp.com/api/v1',
      userId: process.env.WATCHIMP_USER_ID || parsedUserId,
      businessAccountId: process.env.WATCHIMP_BUSINESS_ACCOUNT_ID,
      phoneNumberId: process.env.WATCHIMP_PHONE_NUMBER_ID || '',
      accessToken: process.env.WATCHIMP_ACCESS_TOKEN || parsedAccessToken,
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
      const errMsg = this.extractError(error);
      Logger.error('Error sending Watchimp template', { error: errMsg, template: templateName, phone, userId: this.config.userId });
      return { success: false, error: errMsg };
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

  async sendBookingConfirmation(data: BookingNotificationData & { trackingUrl?: string; qrImageUrl?: string }): Promise<WhatsAppNotificationResult> {
    // Build free-form fallback message
    const trackingInfo = data.trackingUrl ? `\n\nرابط تتبع الحجز:\n${data.trackingUrl}\n\nيمكنك مسح الكود QR المرفق لمتابعة حالة صيانة سيارتك.` : '';
    const freeFormMessage = `مرحباً ${data.customerName}،\n\nتم استلام حجزك في ${data.garageName} بنجاح.\n\nرقم الحجز: ${data.bookingId}\nالمركبة: ${data.vehicleMake} ${data.vehicleModel}\nالتاريخ: ${data.scheduledDate}${trackingInfo}\n\nشكراً لثقتك بنا!`;

    // Try template first
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
    const templateResult = await this.sendTemplateMessage(data.customerPhone, 'booking_confirmation', 'ar', components);
    if (templateResult.success) {
      // If template succeeded and we have a QR image, send it as a separate image message
      if (data.qrImageUrl) {
        try {
          await this.sendDocument(data.customerPhone, data.qrImageUrl, 'امسح الكود QR لمتابعة حالة الحجز', 'booking_qr.png');
        } catch (e) { /* ignore QR send failure */ }
      }
      return templateResult;
    }

    // Fallback: free-form message
    return this.sendMessage({ to: data.customerPhone, message: freeFormMessage });
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

    // Try template first, fallback to free-form text
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
    const templateResult = await this.sendTemplateMessage(data.customerPhone, 'booking_status_update', 'ar', components);
    if (templateResult.success) return templateResult;

    // Fallback: free-form message
    const message = `مرحباً ${data.customerName}،\n\nتم تحديث حالة حجزك في ${data.garageName}.\n\nرقم الحجز: ${data.bookingId}\nالحالة الجديدة: ${statusText}\nالمركبة: ${data.vehicleMake} ${data.vehicleModel}\n\nيمكنك متابعة التفاصيل عبر رابط التتبع الخاص بك.`;
    return this.sendMessage({ to: data.customerPhone, message });
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

  async sendInvoiceNotification(data: InvoiceNotificationData & { pdfUrl?: string }): Promise<WhatsAppNotificationResult> {
    const freeFormMessage = `مرحباً ${data.customerName}،\n\nفاتورتك جاهزة في ${data.garageName}.\n\nرقم الفاتورة: ${data.invoiceNumber}\nالمجموع: ${data.totalAmount.toLocaleString()} ل.س\nتاريخ الاستحقاق: ${data.dueDate}\n\nسيتم إرسال نسخة PDF من الفاتورة في الرسالة التالية.`;

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
    const templateResult = await this.sendTemplateMessage(data.customerPhone, 'invoice_neww', 'ar', components);
    if (templateResult.success) {
      if (data.pdfUrl && this.isEnabled()) {
        try {
          await this.sendInvoicePdf(data.customerPhone, data.pdfUrl, data.invoiceNumber, data.totalAmount);
        } catch (e) {
          Logger.warn('Failed to send invoice PDF', { error: e, invoiceNumber: data.invoiceNumber });
        }
      }
      return templateResult;
    }

    const textResult = await this.sendMessage({ to: data.customerPhone, message: freeFormMessage });
    if (data.pdfUrl && this.isEnabled()) {
      try {
        await this.sendInvoicePdf(data.customerPhone, data.pdfUrl, data.invoiceNumber, data.totalAmount);
      } catch (e) {
        Logger.warn('Failed to send invoice PDF (fallback)', { error: e });
      }
    }
    return textResult;
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
    return this.sendTemplateMessage(data.customerPhone, 'payment_receivedd', 'ar', components);
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
    const templateResult = await this.sendTemplateMessage(customerPhone, 'loyalty_points', 'ar', components);
    if (templateResult.success) return templateResult;

    const freeFormMessage = `مرحباً ${customerName}،\n\nلقد ربحت ${points} نقطة جديدة في ${garageName}. شكراً لولائك!`;
    return this.sendMessage({ to: customerPhone, message: freeFormMessage });
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
    const freeFormMessage = `مرحباً ${customerName}!\n\nأهلاً وسهلاً بك في ${garageName}. نحن سعداء بانضمامك لعائلتنا ونتطلع لخدمة سيارتك على أفضل وجه.\n\nيمكنك حجز موعد الصيانة في أي وقت عبر موقعنا أو بالاتصال بنا.`;

    const components = [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: customerName },
          { type: 'text', text: garageName },
        ],
      },
    ];
    const templateResult = await this.sendTemplateMessage(customerPhone, 'welcomee', 'ar', components);
    if (templateResult.success) return templateResult;

    return this.sendMessage({ to: customerPhone, message: freeFormMessage });
  }

  async sendWarrantyNotification(data: {
    customerName: string;
    customerPhone: string;
    warrantyNumber: string;
    expiryDate: string;
    garageName: string;
    pdfUrl?: string;
  }): Promise<WhatsAppNotificationResult> {
    const freeFormMessage = `مرحباً ${data.customerName}،\n\nتم إنشاء كفالة جديدة لك في ${data.garageName}.\n\nرقم الكفالة: ${data.warrantyNumber}\nتاريخ الانتهاء: ${data.expiryDate}\n\nشهادة الكفالة PDF مرفقة أدناه.`;

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
    const templateResult = await this.sendTemplateMessage(data.customerPhone, 'warranty_new', 'ar', components);
    if (templateResult.success) {
      // Send PDF if available
      if (data.pdfUrl && this.isEnabled()) {
        try {
          await this.sendDocument(
            data.customerPhone,
            data.pdfUrl,
            `شهادة كفالة رقم ${data.warrantyNumber}`,
            `warranty_${data.warrantyNumber}.pdf`
          );
        } catch (e) {
          Logger.warn('Failed to send warranty PDF via Watchimp', { error: e, warrantyNumber: data.warrantyNumber });
        }
      }
      return templateResult;
    }

    // Fallback: send free-form text, then PDF separately
    const textResult = await this.sendMessage({ to: data.customerPhone, message: freeFormMessage });
    if (data.pdfUrl && this.isEnabled()) {
      try {
        await this.sendDocument(
          data.customerPhone,
          data.pdfUrl,
          `شهادة كفالة رقم ${data.warrantyNumber}`,
          `warranty_${data.warrantyNumber}.pdf`
        );
      } catch (e) {
        Logger.warn('Failed to send warranty PDF via Watchimp (fallback)', { error: e });
      }
    }
    return textResult;
  }

  async sendPaymentConfirmationWithPdf(data: InvoiceNotificationData & { pdfUrl?: string }): Promise<WhatsAppNotificationResult> {
    const freeFormMessage = `مرحباً ${data.customerName}،\n\nتم استلام دفعتك في ${data.garageName} بنجاح.\n\nرقم الفاتورة: ${data.invoiceNumber}\nالمبلغ المدفوع: ${data.totalAmount.toLocaleString()} ل.س\n\nشكراً لك! نسخة PDF من الفاتورة المدفوعة مرفقة أدناه.`;

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
    const templateResult = await this.sendTemplateMessage(data.customerPhone, 'payment_receivedd', 'ar', components);
    if (templateResult.success) {
      if (data.pdfUrl && this.isEnabled()) {
        try {
          await this.sendInvoicePdf(data.customerPhone, data.pdfUrl, data.invoiceNumber, data.totalAmount);
        } catch (e) {
          Logger.warn('Failed to send invoice PDF after payment', { error: e, invoiceNumber: data.invoiceNumber });
        }
      }
      return templateResult;
    }

    // Fallback: free-form + PDF
    const textResult = await this.sendMessage({ to: data.customerPhone, message: freeFormMessage });
    if (data.pdfUrl && this.isEnabled()) {
      try {
        await this.sendInvoicePdf(data.customerPhone, data.pdfUrl, data.invoiceNumber, data.totalAmount);
      } catch (e) {
        Logger.warn('Failed to send invoice PDF after payment (fallback)', { error: e });
      }
    }
    return textResult;
  }

  async checkConnection(): Promise<WhatsAppNotificationResult> {
    if (!this.isEnabled()) {
      return { success: false, error: 'Watchimp not enabled or not configured' };
    }

    // If we have all connection credentials, try to verify account connection
    if (this.config.userId && this.config.businessAccountId && this.config.accessToken) {
      try {
        const result = await this.connectAccount();
        if (result.success) {
          return { success: true, messageId: 'connected' };
        }
        return { success: false, error: result.error || 'Watchimp connection failed' };
      } catch (error) {
        return { success: false, error: this.extractError(error) };
      }
    }

    // Otherwise, sending configuration is ready
    return { success: true, messageId: 'ready' };
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
