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
   * Create or update a subscriber with custom fields on WhatChimp.
   * WhatChimp uses custom fields to auto-fill template variables.
   */
  private async setSubscriberCustomFields(
    phone: string,
    customFields: Record<string, string>
  ): Promise<boolean> {
    try {
      // First, create/update subscriber
      const subscriberPayload: any = {
        apiToken: this.config.apiKey,
        phone_number_id: this.config.phoneNumberId,
        phone_number: phone,
      };

      await axios.post(
        `${this.config.apiUrl}/whatsapp/subscriber/create`,
        subscriberPayload,
        { timeout: 10000, headers: { 'Content-Type': 'application/json' } }
      );

      // Then assign custom fields
      const fieldsPayload = {
        apiToken: this.config.apiKey,
        phone_number_id: this.config.phoneNumberId,
        phone_number: phone,
        custom_fields: JSON.stringify(customFields),
      };

      await axios.post(
        `${this.config.apiUrl}/whatsapp/subscriber/chat/assign-custom-fields`,
        fieldsPayload,
        { timeout: 10000, headers: { 'Content-Type': 'application/json' } }
      );

      Logger.debug('WhatChimp subscriber custom fields set', { phone, fields: Object.keys(customFields) });
      return true;
    } catch (error) {
      Logger.error('Error setting WhatChimp subscriber custom fields', { error: this.extractError(error), phone });
      return false;
    }
  }

  /**
   * Send a templated message via WhatChimp.
   * WhatChimp templates pull variables from subscriber's custom fields (NOT inline components).
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    language: string = 'ar',
    customFields: Record<string, string> = {}
  ): Promise<WhatsAppNotificationResult> {
    if (!this.isEnabled()) {
      return { success: false, error: 'Watchimp not enabled' };
    }

    const phone = this.normalizePhone(to);

    try {
      // Step 1: Set custom fields on subscriber
      await this.setSubscriberCustomFields(phone, customFields);

      // Step 2: Send template (WhatChimp auto-fills from subscriber custom fields)
      const response = await axios.post(
        `${this.config.apiUrl}/whatsapp/send`,
        {
          apiToken: this.config.apiKey,
          phone_number_id: this.config.phoneNumberId,
          phone_number: phone,
          template_name: templateName,
          language_code: language,
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      const respData = response.data;
      Logger.debug('WhatChimp template sent', {
        status: respData?.status,
        messageId: respData?.wa_message_id,
        template: templateName,
        phone,
      });

      return {
        success: respData?.status === '1' || respData?.status === 1,
        messageId: respData?.wa_message_id,
      };
    } catch (error) {
      const errMsg = this.extractError(error);
      Logger.error('Error sending WhatChimp template', { error: errMsg, template: templateName, phone });
      return { success: false, error: errMsg };
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

  // ============================================
  // NOTIFICATION METHODS (Updated for WhatChimp Custom Fields)
  // ============================================

  async sendBookingConfirmation(data: BookingNotificationData & { trackingUrl?: string; qrImageUrl?: string }): Promise<WhatsAppNotificationResult> {
    const trackingInfo = data.trackingUrl ? `\n\nرابط تتبع الحجز:\n${data.trackingUrl}\n\nيمكنك مسح الكود QR المرفق لمتابعة حالة صيانة سيارتك.` : '';
    const freeFormMessage = `مرحباً ${data.customerName}،\n\nتم استلام حجزك في ${data.garageName} بنجاح.\n\nرقم الحجز: ${data.bookingId}\nالمركبة: ${data.vehicleMake} ${data.vehicleModel}\nالتاريخ: ${data.scheduledDate}${trackingInfo}\n\nشكراً لثقتك بنا!`;

    // WhatChimp Custom Fields for booking_confirmation template
    const customFields: Record<string, string> = {
      customer_name: data.customerName,
      garage_name: data.garageName,
      booking_id: data.bookingId,
      vehicle_info: `${data.vehicleMake} ${data.vehicleModel}`,
      scheduled_date: data.scheduledDate,
    };

    const templateResult = await this.sendTemplateMessage(data.customerPhone, 'booking_confirmation', 'ar', customFields);
    if (templateResult.success) {
      if (data.qrImageUrl) {
        try {
          await this.sendDocument(data.customerPhone, data.qrImageUrl, 'امسح الكود QR لمتابعة حالة الحجز', 'booking_qr.png');
        } catch (e) { /* ignore QR send failure */ }
      }
      return templateResult;
    }

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

    const freeFormMessage = `مرحباً ${data.customerName}،\n\nتم تحديث حالة حجزك في ${data.garageName}.\n\nرقم الحجز: ${data.bookingId}\nالحالة الجديدة: ${statusText}\nالمركبة: ${data.vehicleMake} ${data.vehicleModel}\n\nيمكنك متابعة التفاصيل عبر رابط التتبع الخاص بك.`;

    // WhatChimp Custom Fields for booking_status_update template
    const customFields: Record<string, string> = {
      customer_name: data.customerName,
      garage_name: data.garageName,
      booking_id: data.bookingId,
      status_text: statusText,
      vehicle_info: `${data.vehicleMake} ${data.vehicleModel}`,
    };

    const templateResult = await this.sendTemplateMessage(data.customerPhone, 'booking_status_update', 'ar', customFields);
    if (templateResult.success) return templateResult;

    return this.sendMessage({ to: data.customerPhone, message: freeFormMessage });
  }

  async sendWelcomeMessage(
    customerName: string,
    customerPhone: string,
    garageName: string
  ): Promise<WhatsAppNotificationResult> {
    const freeFormMessage = `مرحباً ${customerName}!\n\nأهلاً وسهلاً بك في ${garageName}. نحن سعداء بانضمامك لعائلتنا ونتطلع لخدمة سيارتك على أفضل وجه.\n\nيمكنك حجز موعد الصيانة في أي وقت عبر موقعنا أو بالاتصال بنا.`;

    // WhatChimp Custom Fields for welcomee template
    const customFields: Record<string, string> = {
      customer_name: customerName,
      garage_name: garageName,
    };

    const templateResult = await this.sendTemplateMessage(customerPhone, 'welcomee', 'ar', customFields);
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

    // WhatChimp Custom Fields for warranty_new template
    const customFields: Record<string, string> = {
      customer_name: data.customerName,
      garage_name: data.garageName,
      warranty_number: data.warrantyNumber,
      expiry_date: data.expiryDate,
    };

    const templateResult = await this.sendTemplateMessage(data.customerPhone, 'warranty_new', 'ar', customFields);
    if (templateResult.success) {
      if (data.pdfUrl && this.isEnabled()) {
        try {
          await this.sendDocument(
            data.customerPhone,
            data.pdfUrl,
            `شهادة الكفالة - رقم ${data.warrantyNumber}`,
            `warranty_${data.warrantyNumber}.pdf`
          );
        } catch (docError) {
          Logger.error('Error sending warranty PDF via WhatChimp', docError);
        }
      }
      return templateResult;
    }

    return this.sendMessage({ to: data.customerPhone, message: freeFormMessage });
  }

  async sendInvoiceNotification(data: InvoiceNotificationData & { pdfUrl?: string }): Promise<WhatsAppNotificationResult> {
    const freeFormMessage = `مرحباً ${data.customerName}،\n\nفاتورتك جاهزة في ${data.garageName}.\n\nرقم الفاتورة: ${data.invoiceNumber}\nالمجموع: ${data.totalAmount.toLocaleString()} ل.س\nتاريخ الاستحقاق: ${data.dueDate}\n\nسيتم إرسال نسخة PDF من الفاتورة في الرسالة التالية.`;

    // WhatChimp Custom Fields for invoice_neww template
    const customFields: Record<string, string> = {
      customer_name: data.customerName,
      garage_name: data.garageName,
      invoice_number: data.invoiceNumber,
      total_amount: data.totalAmount.toLocaleString(),
      due_date: data.dueDate,
    };

    const templateResult = await this.sendTemplateMessage(data.customerPhone, 'invoice_neww', 'ar', customFields);
    if (templateResult.success) {
      if (data.pdfUrl) {
        try {
          await this.sendInvoicePdf(
            data.customerPhone,
            data.pdfUrl,
            data.invoiceNumber,
            data.totalAmount
          );
        } catch (docError) {
          Logger.error('Error sending invoice PDF via WhatChimp', docError);
        }
      }
      return templateResult;
    }

    return this.sendMessage({ to: data.customerPhone, message: freeFormMessage });
  }

  async sendPaymentReceivedNotification(data: InvoiceNotificationData): Promise<WhatsAppNotificationResult> {
    const freeFormMessage = `مرحباً ${data.customerName}،\n\nتم استلام دفعتك بنجاح في ${data.garageName}.\n\nرقم الفاتورة: ${data.invoiceNumber}\nالمبلغ المدفوع: ${data.totalAmount.toLocaleString()} ل.س\nتاريخ الدفع: ${data.dueDate}\n\nشكراً لك!`;

    // WhatChimp Custom Fields for payment_receivedd template
    const customFields: Record<string, string> = {
      customer_name: data.customerName,
      garage_name: data.garageName,
      invoice_number: data.invoiceNumber,
      total_amount: data.totalAmount.toLocaleString(),
      due_date: data.dueDate,
    };

    const templateResult = await this.sendTemplateMessage(data.customerPhone, 'payment_receivedd', 'ar', customFields);
    if (templateResult.success) return templateResult;

    return this.sendMessage({ to: data.customerPhone, message: freeFormMessage });
  }

  // ============================================
  // UTILITY
  // ============================================

  async testConnection(): Promise<WhatsAppNotificationResult> {
    if (!this.isEnabled()) {
      return { success: false, error: 'Watchimp not enabled or not configured' };
    }

    // Try template list to verify API connectivity
    try {
      const response = await axios.post(
        `${this.config.apiUrl}/whatsapp/template/list`,
        {
          apiToken: this.config.apiKey,
          phone_number_id: this.config.phoneNumberId,
        },
        { timeout: 10000, headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data?.status === '1' || response.data?.status === 1) {
        return { success: true, messageId: 'connected' };
      }
      return { success: false, error: response.data?.message || 'Connection test failed' };
    } catch (error) {
      return { success: false, error: this.extractError(error) };
    }
  }

  private normalizePhone(phone: string): string {
    let cleaned = phone.replace(/\s/g, '').replace(/-/g, '');
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
