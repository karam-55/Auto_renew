import axios from 'axios';
import { Logger } from '../../infrastructure/logging/logger';

export interface WhatsAppNotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface MetaWhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  apiVersion: string;
  isEnabled: boolean;
}

export class MetaWhatsAppService {
  private config: MetaWhatsAppConfig;

  constructor() {
    this.config = {
      accessToken: process.env.META_WHATSAPP_ACCESS_TOKEN || '',
      phoneNumberId: process.env.META_WHATSAPP_PHONE_NUMBER_ID || process.env.WATCHIMP_PHONE_NUMBER_ID || '',
      businessAccountId: process.env.META_WHATSAPP_BUSINESS_ACCOUNT_ID || process.env.WATCHIMP_BUSINESS_ACCOUNT_ID || '',
      apiVersion: process.env.META_WHATSAPP_API_VERSION || 'v18.0',
      isEnabled: process.env.META_WHATSAPP_ENABLED === 'true',
    };
  }

  isEnabled(): boolean {
    return this.config.isEnabled === true &&
           !!this.config.accessToken &&
           !!this.config.phoneNumberId;
  }

  private getBaseUrl(): string {
    return `https://graph.facebook.com/${this.config.apiVersion}`;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.config.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  private normalizePhone(phone: string): string {
    let cleaned = phone.replace(/\s/g, '').replace(/-/g, '');
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    return cleaned;
  }

  /**
   * Send a text message (works within 24h session window)
   */
  async sendMessage(to: string, message: string): Promise<WhatsAppNotificationResult> {
    if (!this.isEnabled()) {
      return { success: false, error: 'Meta WhatsApp not enabled' };
    }

    const phone = this.normalizePhone(to);

    try {
      const response = await axios.post(
        `${this.getBaseUrl()}/${this.config.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phone,
          type: 'text',
          text: { body: message },
        },
        {
          headers: this.getHeaders(),
          timeout: 15000,
        }
      );

      return {
        success: true,
        messageId: response.data?.messages?.[0]?.id,
      };
    } catch (error: any) {
      const errMsg = error.response?.data?.error?.message || error.message;
      Logger.error('Meta WhatsApp send message error', { error: errMsg, phone });
      return { success: false, error: errMsg };
    }
  }

  /**
   * Send a templated message (works anytime - no 24h window restriction)
   */
  async sendTemplate(
    to: string,
    templateName: string,
    languageCode: string = 'ar',
    components: any[] = []
  ): Promise<WhatsAppNotificationResult> {
    if (!this.isEnabled()) {
      return { success: false, error: 'Meta WhatsApp not enabled' };
    }

    const phone = this.normalizePhone(to);

    const payload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
      },
    };

    if (components && components.length > 0) {
      payload.template.components = components;
    }

    try {
      const response = await axios.post(
        `${this.getBaseUrl()}/${this.config.phoneNumberId}/messages`,
        payload,
        {
          headers: this.getHeaders(),
          timeout: 15000,
        }
      );

      Logger.debug('Meta WhatsApp template sent', {
        messageId: response.data?.messages?.[0]?.id,
        template: templateName,
        phone,
      });

      return {
        success: true,
        messageId: response.data?.messages?.[0]?.id,
      };
    } catch (error: any) {
      const errMsg = error.response?.data?.error?.message || error.message;
      const errCode = error.response?.data?.error?.code;
      Logger.error('Meta WhatsApp send template error', {
        error: errMsg,
        code: errCode,
        template: templateName,
        phone,
      });
      return { success: false, error: errMsg };
    }
  }

  /**
   * Send a document (PDF, etc.)
   */
  async sendDocument(
    to: string,
    documentUrl: string,
    caption: string = '',
    filename: string = 'document.pdf'
  ): Promise<WhatsAppNotificationResult> {
    if (!this.isEnabled()) {
      return { success: false, error: 'Meta WhatsApp not enabled' };
    }

    const phone = this.normalizePhone(to);

    try {
      const response = await axios.post(
        `${this.getBaseUrl()}/${this.config.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phone,
          type: 'document',
          document: {
            link: documentUrl,
            caption: caption,
            filename: filename,
          },
        },
        {
          headers: this.getHeaders(),
          timeout: 20000,
        }
      );

      return {
        success: true,
        messageId: response.data?.messages?.[0]?.id,
      };
    } catch (error: any) {
      const errMsg = error.response?.data?.error?.message || error.message;
      Logger.error('Meta WhatsApp send document error', { error: errMsg, phone, url: documentUrl });
      return { success: false, error: errMsg };
    }
  }

  // ============================================
  // HIGH-LEVEL NOTIFICATION METHODS
  // ============================================

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

    const templateResult = await this.sendTemplate(customerPhone, 'welcomee', 'ar', components);
    if (templateResult.success) return templateResult;

    // Fallback
    const message = `مرحباً ${customerName}!\n\nأهلاً وسهلاً بك في ${garageName}. نحن سعداء بانضمامك لعائلتنا ونتطلع لخدمة سيارتك على أفضل وجه.`;
    return this.sendMessage(customerPhone, message);
  }

  async sendBookingConfirmation(data: {
    customerName: string;
    customerPhone: string;
    bookingId: string;
    vehicleMake: string;
    vehicleModel: string;
    scheduledDate: string;
    garageName: string;
    trackingUrl?: string;
    qrImageUrl?: string;
  }): Promise<WhatsAppNotificationResult> {
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

    const templateResult = await this.sendTemplate(data.customerPhone, 'booking_confirmation', 'ar', components);
    if (templateResult.success) {
      if (data.qrImageUrl) {
        try {
          await this.sendDocument(data.customerPhone, data.qrImageUrl, 'امسح الكود QR لمتابعة حالة الحجز', 'booking_qr.png');
        } catch (e) { /* ignore */ }
      }
      return templateResult;
    }

    const trackingInfo = data.trackingUrl ? `\n\nرابط تتبع الحجز:\n${data.trackingUrl}` : '';
    const message = `مرحباً ${data.customerName}،\n\nتم استلام حجزك في ${data.garageName} بنجاح.\n\nرقم الحجز: ${data.bookingId}\nالمركبة: ${data.vehicleMake} ${data.vehicleModel}\nالتاريخ: ${data.scheduledDate}${trackingInfo}\n\nشكراً لثقتك بنا!`;
    return this.sendMessage(data.customerPhone, message);
  }

  async sendBookingStatusUpdate(data: {
    customerName: string;
    customerPhone: string;
    bookingId: string;
    vehicleMake: string;
    vehicleModel: string;
    scheduledDate: string;
    status: string;
    garageName: string;
  }): Promise<WhatsAppNotificationResult> {
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

    const templateResult = await this.sendTemplate(data.customerPhone, 'booking_status_update', 'ar', components);
    if (templateResult.success) return templateResult;

    const message = `مرحباً ${data.customerName}،\n\nتم تحديث حالة حجزك في ${data.garageName}.\n\nرقم الحجز: ${data.bookingId}\nالحالة الجديدة: ${statusText}\nالمركبة: ${data.vehicleMake} ${data.vehicleModel}`;
    return this.sendMessage(data.customerPhone, message);
  }

  async sendInvoiceNotification(data: {
    customerName: string;
    customerPhone: string;
    invoiceNumber: string;
    totalAmount: number;
    dueDate: string;
    garageName: string;
    pdfUrl?: string;
  }): Promise<WhatsAppNotificationResult> {
    const components = [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: data.customerName },
          { type: 'text', text: data.garageName },
          { type: 'text', text: data.invoiceNumber },
          { type: 'text', text: data.totalAmount.toLocaleString() },
          { type: 'text', text: data.dueDate },
        ],
      },
    ];

    const templateResult = await this.sendTemplate(data.customerPhone, 'invoice_neww', 'ar', components);
    if (templateResult.success) {
      if (data.pdfUrl) {
        try {
          await this.sendDocument(
            data.customerPhone,
            data.pdfUrl,
            `فاتورتك رقم ${data.invoiceNumber} - الإجمالي: ${data.totalAmount.toLocaleString()} ل.س`,
            `invoice_${data.invoiceNumber}.pdf`
          );
        } catch (e) { /* ignore */ }
      }
      return templateResult;
    }

    const message = `مرحباً ${data.customerName}،\n\nفاتورتك جاهزة في ${data.garageName}.\n\nرقم الفاتورة: ${data.invoiceNumber}\nالمجموع: ${data.totalAmount.toLocaleString()} ل.س\nتاريخ الاستحقاق: ${data.dueDate}`;
    return this.sendMessage(data.customerPhone, message);
  }

  async sendPaymentReceivedNotification(data: {
    customerName: string;
    customerPhone: string;
    invoiceNumber: string;
    totalAmount: number;
    dueDate: string;
    garageName: string;
  }): Promise<WhatsAppNotificationResult> {
    const components = [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: data.customerName },
          { type: 'text', text: data.garageName },
          { type: 'text', text: data.invoiceNumber },
          { type: 'text', text: data.totalAmount.toLocaleString() },
          { type: 'text', text: data.dueDate },
        ],
      },
    ];

    const templateResult = await this.sendTemplate(data.customerPhone, 'payment_receivedd', 'ar', components);
    if (templateResult.success) return templateResult;

    const message = `مرحباً ${data.customerName}،\n\nتم استلام دفعتك بنجاح في ${data.garageName}.\n\nرقم الفاتورة: ${data.invoiceNumber}\nالمبلغ المدفوع: ${data.totalAmount.toLocaleString()} ل.س`;
    return this.sendMessage(data.customerPhone, message);
  }

  /**
   * Send payment confirmation with optional PDF
   */
  async sendPaymentConfirmationWithPdf(data: {
    customerName: string;
    customerPhone: string;
    invoiceNumber: string;
    totalAmount: number;
    dueDate: string;
    garageName: string;
    pdfUrl?: string;
  }): Promise<WhatsAppNotificationResult> {
    const result = await this.sendPaymentReceivedNotification(data);
    if (result.success && data.pdfUrl) {
      try {
        await this.sendDocument(
          data.customerPhone,
          data.pdfUrl,
          `فاتورة الدفع - رقم ${data.invoiceNumber}`,
          `invoice_${data.invoiceNumber}.pdf`
        );
      } catch (e) { /* ignore PDF send failure */ }
    }
    return result;
  }

  async sendWarrantyNotification(data: {
    customerName: string;
    customerPhone: string;
    warrantyNumber: string;
    expiryDate: string;
    garageName: string;
    pdfUrl?: string;
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

    const templateResult = await this.sendTemplate(data.customerPhone, 'warranty_new', 'ar', components);
    if (templateResult.success) {
      if (data.pdfUrl) {
        try {
          await this.sendDocument(
            data.customerPhone,
            data.pdfUrl,
            `شهادة الكفالة - رقم ${data.warrantyNumber}`,
            `warranty_${data.warrantyNumber}.pdf`
          );
        } catch (e) { /* ignore */ }
      }
      return templateResult;
    }

    const message = `مرحباً ${data.customerName}،\n\nتم إنشاء كفالة جديدة لك في ${data.garageName}.\n\nرقم الكفالة: ${data.warrantyNumber}\nتاريخ الانتهاء: ${data.expiryDate}`;
    return this.sendMessage(data.customerPhone, message);
  }
}
