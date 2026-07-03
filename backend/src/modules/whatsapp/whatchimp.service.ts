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

export interface WhatChimpConfig {
  apiKey: string;
  apiUrl: string;
  phoneNumberId: string;
  botFlowIds: {
    welcome?: string;
    bookingConfirmation?: string;
    bookingStatusUpdate?: string;
    invoiceNew?: string;
    paymentReceived?: string;
    warrantyNew?: string;
  };
  isEnabled: boolean;
}

/**
 * WhatChimp WhatsApp Service
 * Uses WhatChimp REST API (app.whatchimp.com/api/v1)
 *
 * WhatChimp DOES NOT support direct template sending via API.
 * Instead, it supports:
 * 1. Send Text Message (within 24h session window only)
 * 2. Trigger Bot Flow (for templates outside 24h window)
 * 3. Send Media/File
 *
 * For template messages to work, you MUST create Bot Flows in the
 * WhatChimp Dashboard and set their IDs in the config.
 */
export class WhatChimpService {
  private config: WhatChimpConfig;
  private io: SocketIOServer | null = null;

  constructor() {
    this.config = {
      apiKey: process.env.WHATCHIMP_API_KEY || process.env.WATCHIMP_API_KEY || '',
      apiUrl: process.env.WHATCHIMP_API_URL || process.env.WATCHIMP_API_URL || 'https://app.whatchimp.com/api/v1',
      phoneNumberId: process.env.WHATCHIMP_PHONE_NUMBER_ID || process.env.WATCHIMP_PHONE_NUMBER_ID || '',
      botFlowIds: {
        welcome: process.env.WHATCHIMP_BOT_FLOW_WELCOME || '',
        bookingConfirmation: process.env.WHATCHIMP_BOT_FLOW_BOOKING_CONFIRMATION || '',
        bookingStatusUpdate: process.env.WHATCHIMP_BOT_FLOW_BOOKING_STATUS_UPDATE || '',
        invoiceNew: process.env.WHATCHIMP_BOT_FLOW_INVOICE_NEW || '',
        paymentReceived: process.env.WHATCHIMP_BOT_FLOW_PAYMENT_RECEIVED || '',
        warrantyNew: process.env.WHATCHIMP_BOT_FLOW_WARRANTY_NEW || '',
      },
      isEnabled: (process.env.WHATCHIMP_ENABLED || process.env.WATCHIMP_ENABLED) === 'true',
    };
  }

  setIo(io: SocketIOServer) {
    this.io = io;
  }

  isEnabled(): boolean {
    return this.config.isEnabled === true &&
           !!this.config.apiKey &&
           !!this.config.apiUrl &&
           !!this.config.phoneNumberId;
  }

  // ============================================
  // CORE API METHODS (WhatChimp Official Endpoints)
  // ============================================

  /**
   * Send a free-form text message.
   * ONLY works within 24 hours of customer's last message!
   */
  async sendMessage(to: string, message: string): Promise<WhatsAppNotificationResult> {
    if (!this.isEnabled()) {
      return { success: false, error: 'WhatChimp not enabled' };
    }

    const phone = this.normalizePhone(to);

    try {
      const response = await axios.post(
        `${this.config.apiUrl}/whatsapp/send`,
        {
          apiToken: this.config.apiKey,
          phone_number_id: this.config.phoneNumberId,
          message: message,
          phone_number: phone,
        },
        {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      Logger.debug('WhatChimp message sent', { messageId: response.data?.wa_message_id });
      return {
        success: response.data?.status === '1' || response.data?.status === 1,
        messageId: response.data?.wa_message_id,
      };
    } catch (error: any) {
      const errMsg = this.extractError(error);
      Logger.error('WhatChimp send message error', { error: errMsg, phone });
      return { success: false, error: errMsg };
    }
  }

  /**
   * Trigger a Bot Flow (for template messages outside 24h window)
   */
  async triggerBotFlow(to: string, botFlowId: string): Promise<WhatsAppNotificationResult> {
    if (!this.isEnabled()) {
      return { success: false, error: 'WhatChimp not enabled' };
    }

    if (!botFlowId) {
      return { success: false, error: 'Bot Flow ID not configured' };
    }

    const phone = this.normalizePhone(to);

    try {
      const response = await axios.post(
        `${this.config.apiUrl}/whatsapp/trigger-bot`,
        {
          apiToken: this.config.apiKey,
          phone_number_id: this.config.phoneNumberId,
          bot_flow_unique_id: botFlowId,
          phone_number: phone,
        },
        {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      Logger.debug('WhatChimp bot flow triggered', { flowId: botFlowId, phone });
      return {
        success: response.data?.status === '1' || response.data?.status === 1,
        messageId: response.data?.wa_message_id,
      };
    } catch (error: any) {
      const errMsg = this.extractError(error);
      Logger.error('WhatChimp trigger bot flow error', { error: errMsg, flowId: botFlowId, phone });
      return { success: false, error: errMsg };
    }
  }

  /**
   * Send a file/media via WhatsApp
   */
  async sendDocument(to: string, documentUrl: string, caption: string = '', filename: string = ''): Promise<WhatsAppNotificationResult> {
    if (!this.isEnabled()) {
      return { success: false, error: 'WhatChimp not enabled' };
    }

    const phone = this.normalizePhone(to);

    try {
      const payload: any = {
        apiToken: this.config.apiKey,
        phone_number_id: this.config.phoneNumberId,
        phone_number: phone,
        media_url: documentUrl,
        media_type: 'document',
      };

      if (caption) {
        payload.media_caption_text = caption;
      }

      const response = await axios.post(
        `${this.config.apiUrl}/whatsapp/send/file`,
        payload,
        {
          timeout: 20000,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      Logger.debug('WhatChimp document sent', { messageId: response.data?.wa_message_id });
      return {
        success: response.data?.status === '1' || response.data?.status === 1,
        messageId: response.data?.wa_message_id,
      };
    } catch (error: any) {
      const errMsg = this.extractError(error);
      Logger.error('WhatChimp send document error', { error: errMsg, phone, url: documentUrl });
      return { success: false, error: errMsg };
    }
  }

  // ============================================
  // SUBSCRIBER MANAGEMENT
  // ============================================

  /**
   * Create or ensure subscriber exists in WhatChimp
   */
  async createSubscriber(phone: string, name: string): Promise<boolean> {
    if (!this.isEnabled()) return false;

    try {
      await axios.post(
        `${this.config.apiUrl}/whatsapp/subscriber/create`,
        {
          apiToken: this.config.apiKey,
          phone_number_id: this.config.phoneNumberId,
          phone_number: this.normalizePhone(phone),
          name: name,
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      return true;
    } catch (error: any) {
      Logger.debug('WhatChimp subscriber create (may already exist)', { error: this.extractError(error), phone });
      return true; // Often returns error if subscriber already exists, that's OK
    }
  }

  /**
   * Assign custom fields to a subscriber
   * These fields are used by Bot Flows to fill template variables
   */
  async assignCustomFields(phone: string, customFields: Record<string, string>): Promise<boolean> {
    if (!this.isEnabled()) return false;

    try {
      await axios.post(
        `${this.config.apiUrl}/whatsapp/subscriber/chat/assign-custom-fields`,
        {
          apiToken: this.config.apiKey,
          phone_number_id: this.config.phoneNumberId,
          phone_number: this.normalizePhone(phone),
          custom_fields: JSON.stringify(customFields),
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      Logger.debug('WhatChimp custom fields assigned', { phone, fields: Object.keys(customFields) });
      return true;
    } catch (error: any) {
      Logger.error('WhatChimp assign custom fields error', { error: this.extractError(error), phone });
      return false;
    }
  }

  // ============================================
  // HIGH-LEVEL NOTIFICATION METHODS
  // ============================================

  /**
   * Send Welcome Message
   * Uses Bot Flow (template) if configured, otherwise free-form text
   */
  async sendWelcomeMessage(customerName: string, customerPhone: string, garageName: string): Promise<WhatsAppNotificationResult> {
    // First, ensure subscriber exists with custom fields
    await this.createSubscriber(customerPhone, customerName);
    await this.assignCustomFields(customerPhone, {
      customer_name: customerName,
      garage_name: garageName,
    });

    // Try Bot Flow (template) first
    if (this.config.botFlowIds.welcome) {
      return this.triggerBotFlow(customerPhone, this.config.botFlowIds.welcome);
    }

    // Fallback: free-form text (may fail outside 24h window)
    const message = `مرحباً ${customerName}!\n\nأهلاً وسهلاً بك في ${garageName}. نحن سعداء بانضمامك لعائلتنا ونتطلع لخدمة سيارتك على أفضل وجه.`;
    return this.sendMessage(customerPhone, message);
  }

  /**
   * Send Booking Confirmation
   */
  async sendBookingConfirmation(data: BookingNotificationData & { trackingUrl?: string; qrImageUrl?: string }): Promise<WhatsAppNotificationResult> {
    await this.createSubscriber(data.customerPhone, data.customerName);
    await this.assignCustomFields(data.customerPhone, {
      customer_name: data.customerName,
      garage_name: data.garageName,
      booking_id: data.bookingId,
      vehicle_info: `${data.vehicleMake} ${data.vehicleModel}`,
      scheduled_date: data.scheduledDate,
      tracking_url: data.trackingUrl || '',
    });

    if (this.config.botFlowIds.bookingConfirmation) {
      const result = await this.triggerBotFlow(data.customerPhone, this.config.botFlowIds.bookingConfirmation);
      if (result.success && data.qrImageUrl) {
        try {
          await this.sendDocument(data.customerPhone, data.qrImageUrl, 'امسح الكود QR لمتابعة حالة الحجز', 'booking_qr.png');
        } catch (e) { /* ignore */ }
      }
      return result;
    }

    const trackingInfo = data.trackingUrl ? `\n\nرابط تتبع الحجز:\n${data.trackingUrl}` : '';
    const message = `مرحباً ${data.customerName}،\n\nتم استلام حجزك في ${data.garageName} بنجاح.\n\nرقم الحجز: ${data.bookingId}\nالمركبة: ${data.vehicleMake} ${data.vehicleModel}\nالتاريخ: ${data.scheduledDate}${trackingInfo}`;
    return this.sendMessage(data.customerPhone, message);
  }

  /**
   * Send Booking Status Update
   */
  async sendBookingStatusUpdate(data: BookingNotificationData): Promise<WhatsAppNotificationResult> {
    const statusMessages: Record<string, string> = {
      'IN_PROGRESS': 'جاري العمل',
      'WAITING_PARTS': 'بانتظار قطع الغيار',
      'READY': 'جاهز للاستلام',
      'COMPLETED': 'مكتمل',
      'CANCELLED': 'ملغى',
    };
    const statusText = statusMessages[data.status] || data.status;

    await this.createSubscriber(data.customerPhone, data.customerName);
    await this.assignCustomFields(data.customerPhone, {
      customer_name: data.customerName,
      garage_name: data.garageName,
      booking_id: data.bookingId,
      status_text: statusText,
      vehicle_info: `${data.vehicleMake} ${data.vehicleModel}`,
      scheduled_date: data.scheduledDate,
    });

    if (this.config.botFlowIds.bookingStatusUpdate) {
      return this.triggerBotFlow(data.customerPhone, this.config.botFlowIds.bookingStatusUpdate);
    }

    const message = `مرحباً ${data.customerName}،\n\nتم تحديث حالة حجزك في ${data.garageName}.\n\nرقم الحجز: ${data.bookingId}\nالحالة الجديدة: ${statusText}\nالمركبة: ${data.vehicleMake} ${data.vehicleModel}`;
    return this.sendMessage(data.customerPhone, message);
  }

  /**
   * Send Invoice Notification
   */
  async sendInvoiceNotification(data: InvoiceNotificationData & { pdfUrl?: string }): Promise<WhatsAppNotificationResult> {
    await this.createSubscriber(data.customerPhone, data.customerName);
    await this.assignCustomFields(data.customerPhone, {
      customer_name: data.customerName,
      garage_name: data.garageName,
      invoice_number: data.invoiceNumber,
      total_amount: data.totalAmount.toLocaleString(),
      due_date: data.dueDate,
    });

    if (this.config.botFlowIds.invoiceNew) {
      const result = await this.triggerBotFlow(data.customerPhone, this.config.botFlowIds.invoiceNew);
      if (result.success && data.pdfUrl) {
        try {
          await this.sendDocument(data.customerPhone, data.pdfUrl, `فاتورتك رقم ${data.invoiceNumber}`, `invoice_${data.invoiceNumber}.pdf`);
        } catch (e) { /* ignore */ }
      }
      return result;
    }

    const message = `مرحباً ${data.customerName}،\n\nفاتورتك جاهزة في ${data.garageName}.\n\nرقم الفاتورة: ${data.invoiceNumber}\nالمجموع: ${data.totalAmount.toLocaleString()} ل.س\nتاريخ الاستحقاق: ${data.dueDate}`;
    return this.sendMessage(data.customerPhone, message);
  }

  /**
   * Send Payment Received Notification
   */
  async sendPaymentReceivedNotification(data: InvoiceNotificationData): Promise<WhatsAppNotificationResult> {
    await this.createSubscriber(data.customerPhone, data.customerName);
    await this.assignCustomFields(data.customerPhone, {
      customer_name: data.customerName,
      garage_name: data.garageName,
      invoice_number: data.invoiceNumber,
      total_amount: data.totalAmount.toLocaleString(),
      due_date: data.dueDate,
    });

    if (this.config.botFlowIds.paymentReceived) {
      return this.triggerBotFlow(data.customerPhone, this.config.botFlowIds.paymentReceived);
    }

    const message = `مرحباً ${data.customerName}،\n\nتم استلام دفعتك بنجاح في ${data.garageName}.\n\nرقم الفاتورة: ${data.invoiceNumber}\nالمبلغ المدفوع: ${data.totalAmount.toLocaleString()} ل.س`;
    return this.sendMessage(data.customerPhone, message);
  }

  /**
   * Send Payment Confirmation with optional PDF
   * This method delegates to sendPaymentReceivedNotification then sends PDF
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

  /**
   * Send Warranty Notification
   */
  async sendWarrantyNotification(data: {
    customerName: string;
    customerPhone: string;
    warrantyNumber: string;
    expiryDate: string;
    garageName: string;
    pdfUrl?: string;
  }): Promise<WhatsAppNotificationResult> {
    await this.createSubscriber(data.customerPhone, data.customerName);
    await this.assignCustomFields(data.customerPhone, {
      customer_name: data.customerName,
      garage_name: data.garageName,
      warranty_number: data.warrantyNumber,
      expiry_date: data.expiryDate,
    });

    if (this.config.botFlowIds.warrantyNew) {
      const result = await this.triggerBotFlow(data.customerPhone, this.config.botFlowIds.warrantyNew);
      if (result.success && data.pdfUrl) {
        try {
          await this.sendDocument(data.customerPhone, data.pdfUrl, `شهادة الكفالة - رقم ${data.warrantyNumber}`, `warranty_${data.warrantyNumber}.pdf`);
        } catch (e) { /* ignore */ }
      }
      return result;
    }

    const message = `مرحباً ${data.customerName}،\n\nتم إنشاء كفالة جديدة لك في ${data.garageName}.\n\nرقم الكفالة: ${data.warrantyNumber}\nتاريخ الانتهاء: ${data.expiryDate}`;
    return this.sendMessage(data.customerPhone, message);
  }

  // ============================================
  // UTILITY
  // ============================================

  /**
   * Get list of approved templates from WhatChimp
   */
  async getTemplateList(): Promise<any[]> {
    if (!this.isEnabled()) return [];

    try {
      const response = await axios.post(
        `${this.config.apiUrl}/whatsapp/template/list`,
        {
          apiToken: this.config.apiKey,
          phone_number_id: this.config.phoneNumberId,
        },
        {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (response.data?.status === '1' || response.data?.status === 1) {
        return Array.isArray(response.data?.message) ? response.data.message : [response.data?.message];
      }
      return [];
    } catch (error: any) {
      Logger.error('WhatChimp get template list error', { error: this.extractError(error) });
      return [];
    }
  }

  private normalizePhone(phone: string): string {
    // WhatChimp requires: country code + number, NO + sign, numeric only
    let cleaned = phone.replace(/\s/g, '').replace(/-/g, '').replace(/\+/g, '');
    return cleaned;
  }

  private extractError(error: any): string {
    if (axios.isAxiosError(error)) {
      return error.response?.data?.message || error.response?.data?.error || error.message;
    }
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
