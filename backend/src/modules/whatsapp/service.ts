import axios from 'axios';
import { Server as SocketIOServer } from 'socket.io';
import {
  WhatsAppConfig,
  WhatsAppMessage,
  BookingNotificationData,
  InstallmentReminderData,
  InvoiceNotificationData,
  WhatsAppNotificationResult
} from './types';
import { Logger } from '../../infrastructure/logging/logger';
import { WatchimpService } from './watchimp.service';

export class WhatsAppService {
  private config: WhatsAppConfig;
  private io: SocketIOServer | null = null;
  private watchimpService: WatchimpService;

  constructor() {
    this.config = {
      apiKey: process.env.WHATSAPP_API_KEY || '',
      apiUrl: process.env.WHATSAPP_API_URL || 'https://api.evolution-api.com',
      instanceName: process.env.WHATSAPP_INSTANCE_NAME || '',
      isEnabled: process.env.WHATSAPP_ENABLED === 'true' || process.env.WATCHIMP_ENABLED === 'true',
    };
    this.watchimpService = new WatchimpService();
  }

  setIo(io: SocketIOServer) {
    this.io = io;
    this.watchimpService.setIo(io);
  }

  private useWatchimp(): boolean {
    return this.watchimpService.isEnabled();
  }

  // ============================================
  // CONFIGURATION MANAGEMENT
  // ============================================

  updateConfig(config: Partial<WhatsAppConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): WhatsAppConfig {
    return this.config;
  }

  isEnabled(): boolean {
    return this.config.isEnabled === true && 
           !!this.config.apiKey && 
           !!this.config.apiUrl && 
           !!this.config.instanceName;
  }

  // ============================================
  // MESSAGE SENDING
  // ============================================

  async sendMessage(message: WhatsAppMessage): Promise<WhatsAppNotificationResult> {
    if (!this.isEnabled()) {
      Logger.debug('WhatsApp is not enabled or not configured');
      return { success: false, error: 'WhatsApp not enabled' };
    }

    // Delegate to Watchimp when configured
    if (this.useWatchimp()) {
      return this.watchimpService.sendMessage(message);
    }

    const formattedNumber = this.formatPhoneNumber(message.to);

    try {
      const response = await axios.post(
        `${this.config.apiUrl}/message/sendText/${this.config.instanceName}`,
        {
          number: formattedNumber,
          text: message.message,
        },
        {
          headers: {
            'apikey': this.config.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 8000, // 8s max — never block booking creation
        }
      );

      if (response.data && response.data.key) {
        Logger.debug('WhatsApp message sent successfully', { messageId: response.data.key.id });
        return { success: true, messageId: response.data.key.id };
      }

      return { success: false, error: 'Invalid response from WhatsApp API' };
    } catch (error) {
      Logger.error('Error sending WhatsApp message', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ============================================
  // BOOKING NOTIFICATIONS
  // ============================================

  async sendBookingConfirmation(data: BookingNotificationData): Promise<WhatsAppNotificationResult> {
    const message = `🔧 *تأكيد حجز جديد*

مرحباً ${data.customerName}،

تم تأكيد حجزك في ${data.garageName} بنجاح.

📅 التاريخ: ${data.scheduledDate}
🚗 المركبة: ${data.vehicleMake} ${data.vehicleModel}
📋 رقم الحجز: ${data.bookingId}

نتطلع لخدمتك قريباً!

${data.garageName}`;

    return this.sendMessage({
      to: data.customerPhone,
      message,
    });
  }

  async sendBookingStatusUpdate(data: BookingNotificationData): Promise<WhatsAppNotificationResult> {
    const statusMessages: Record<string, string> = {
      'IN_PROGRESS': 'جاري العمل على مركبتك',
      'WAITING_PARTS': 'ننتظر وصول قطع الغيار',
      'READY': 'مركبتك جاهزة للاستلام',
      'COMPLETED': 'تم إكمال العمل بنجاح',
      'CANCELLED': 'تم إلغاء الحجز',
    };

    const statusMessage = statusMessages[data.status] || data.status;

    const message = `🔧 *تحديث حالة الحجز*

مرحباً ${data.customerName}،

تحديث حالة حجزك في ${data.garageName}:

📋 رقم الحجز: ${data.bookingId}
🚗 المركبة: ${data.vehicleMake} ${data.vehicleModel}
📅 التاريخ: ${data.scheduledDate}
✅ الحالة: ${statusMessage}

${data.garageName}`;

    return this.sendMessage({
      to: data.customerPhone,
      message,
    });
  }

  // ============================================
  // INSTALLMENT REMINDERS
  // ============================================

  async sendInstallmentReminder(data: InstallmentReminderData): Promise<WhatsAppNotificationResult> {
    const message = `💰 *تذكير بالقسط المستحق*

مرحباً ${data.customerName}،

نود تذكيرك بأن هناك قسط مستحق في ${data.garageName}.

💰 المبلغ: ${data.installmentAmount.toLocaleString()} ل.س
📅 تاريخ الاستحقاق: ${data.dueDate}
📋 رقم الفاتورة: ${data.invoiceNumber}

يرجى تسديد القسط في الموعد المحدد لتجنب رسوم التأخير.

${data.garageName}`;

    return this.sendMessage({
      to: data.customerPhone,
      message,
    });
  }

  async sendInstallmentOverdue(data: InstallmentReminderData): Promise<WhatsAppNotificationResult> {
    const message = `⚠️ *قسط متأخر*

مرحباً ${data.customerName}،

نود إبلاغك بأن هناك قسط متأخر في ${data.garageName}.

💰 المبلغ: ${data.installmentAmount.toLocaleString()} ل.س
📅 تاريخ الاستحقاق: ${data.dueDate}
📋 رقم الفاتورة: ${data.invoiceNumber}

يرجى التواصل معنا لتسديد القسط في أقرب وقت ممكن.

${data.garageName}`;

    return this.sendMessage({
      to: data.customerPhone,
      message,
    });
  }

  // ============================================
  // INVOICE NOTIFICATIONS
  // ============================================

  async sendInvoiceNotification(data: InvoiceNotificationData): Promise<WhatsAppNotificationResult> {
    const message = `📄 *فاتورة جديدة*

مرحباً ${data.customerName}،

تم إصدار فاتورة جديدة في ${data.garageName}.

📋 رقم الفاتورة: ${data.invoiceNumber}
💰 المبلغ الإجمالي: ${data.totalAmount.toLocaleString()} ل.س
📅 تاريخ الاستحقاق: ${data.dueDate}

يرجى مراجعة الفاتورة وتسديد المبلغ في الموعد المحدد.

${data.garageName}`;

    return this.sendMessage({
      to: data.customerPhone,
      message,
    });
  }

  async sendPaymentConfirmation(data: InvoiceNotificationData): Promise<WhatsAppNotificationResult> {
    const message = `✅ *تأكيد الدفع*

مرحباً ${data.customerName}،

تم استلام دفعتك بنجاح في ${data.garageName}.

📋 رقم الفاتورة: ${data.invoiceNumber}
💰 المبلغ: ${data.totalAmount.toLocaleString()} ل.س

شكراً لتعاملكم معنا!

${data.garageName}`;

    return this.sendMessage({
      to: data.customerPhone,
      message,
    });
  }

  // ============================================
  // LOYALTY NOTIFICATIONS
  // ============================================

  async sendLoyaltyPointsEarned(customerName: string, customerPhone: string, points: number, garageName: string): Promise<WhatsAppNotificationResult> {
    const message = `🎁 *نقاط ولاء جديدة*

مرحباً ${customerName}،

مبروك! حصلت على ${points} نقطة ولاء جديدة في ${garageName}.

استخدم نقاطك للحصول على خصومات ومكافآت حصرية!

${garageName}`;

    return this.sendMessage({
      to: customerPhone,
      message,
    });
  }

  async sendLoyaltyTierUpgrade(customerName: string, customerPhone: string, newTier: string, garageName: string): Promise<WhatsAppNotificationResult> {
    const message = `🏆 *ترقية مستوى الولاء*

مرحباً ${customerName}،

تهانينا! تم ترقية مستوى ولائك إلى ${newTier} في ${garageName}.

استمتع بالمزايا الحصرية والخصومات الخاصة بمستوى ${newTier}!

${garageName}`;

    return this.sendMessage({
      to: customerPhone,
      message,
    });
  }

  // ============================================
  // WELCOME MESSAGE
  // ============================================

  async sendWelcomeMessage(customerName: string, customerPhone: string, garageName: string): Promise<WhatsAppNotificationResult> {
    const message = `👋 *أهلاً وسهلاً*

مرحباً ${customerName}،

تم تسجيلك بنجاح في نظام ${garageName}.

يمكنك الآن:
• 📅 حجز مواعيد الصيانة
• 📋 متابعة حالة حجوزاتك
• 🚗 إدارة مركباتك
• 💰 الاستفادة من عروضنا

نحن هنا لخدمتك!

${garageName}`;

    return this.sendMessage({
      to: customerPhone,
      message,
    });
  }

  // ============================================
  // PREVENTIVE MAINTENANCE REMINDERS
  // ============================================

  async sendMaintenanceReminder(reminder: {
    logId: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
    vehicleId: string;
    vehicleMake: string;
    vehicleModel: string;
    templateName: string;
    scheduledKm: number;
    scheduledDate: string;
    garageName: string;
  }): Promise<WhatsAppNotificationResult> {
    const message = `🔧 *تذكير بالصيانة الدورية*

مرحباً ${reminder.customerName}،

نود تذكيرك بأن صيانة ${reminder.templateName} لمركبتك قريبة في ${reminder.garageName}.

🚗 المركبة: ${reminder.vehicleMake} ${reminder.vehicleModel}
🔧 نوع الصيانة: ${reminder.templateName}
📅 التاريخ المقترح: ${new Date(reminder.scheduledDate).toLocaleDateString('ar-EG')}
🔢 الكيلومترات: ${reminder.scheduledKm} كم

يرجى حجز موعد للصيانة للحفاظ على سلامة مركبتك.

${reminder.garageName}`;

    return this.sendMessage({
      to: reminder.customerPhone,
      message,
    });
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private formatPhoneNumber(phone: string | null | undefined): string {
    if (!phone) {
      throw new Error('Phone number is required but was not provided');
    }

    // Remove any non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    if (!cleaned || cleaned.length < 7) {
      throw new Error(`Invalid phone number: ${phone}`);
    }

    // Remove leading 0 if present (local format: 09xx → international: 9639xx)
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    // Add country code if not present (assuming Syria: +963)
    if (!cleaned.startsWith('963')) {
      cleaned = '963' + cleaned;
    }

    return cleaned;
  }

  async sendMedia(data: { to: string; mediaBase64: string; fileName: string; caption?: string; mimeType?: string }): Promise<WhatsAppNotificationResult> {
    if (!this.isEnabled()) {
      Logger.debug('WhatsApp is not enabled or not configured');
      return { success: false, error: 'WhatsApp not enabled' };
    }

    // Watchimp media support via text fallback (full media support can be added later)
    if (this.useWatchimp()) {
      return this.watchimpService.sendMessage({
        to: data.to,
        message: data.caption
          ? `${data.caption}\n\n(ملف مرفق: ${data.fileName})`
          : `ملف مرفق: ${data.fileName}`,
      });
    }

    const formattedNumber = this.formatPhoneNumber(data.to);

    try {
      const response = await axios.post(
        `${this.config.apiUrl}/message/sendMedia/${this.config.instanceName}`,
        {
          number: formattedNumber,
          mediatype: 'document',
          media: data.mediaBase64,
          fileName: data.fileName,
          caption: data.caption || '',
          mimetype: data.mimeType || 'application/pdf',
        },
        {
          headers: {
            'apikey': this.config.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data && response.data.key) {
        Logger.debug('WhatsApp media sent successfully', { messageId: response.data.key.id });
        return { success: true, messageId: response.data.key.id };
      }

      return { success: false, error: 'Invalid response from WhatsApp API' };
    } catch (error) {
      Logger.error('Error sending WhatsApp media', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendWarrantyNotification(data: {
    customerName: string;
    customerPhone: string;
    vehicleModel: string;
    plateNumber: string;
    durationMonths: number;
    pdfBase64: string;
  }): Promise<WhatsAppNotificationResult> {
    const textMessage = `🛡️ *تم تسجيل كفالتك بنجاح*

مرحباً ${data.customerName}،

تم تسجيل كفالة سيارتك (${data.vehicleModel} - ${data.plateNumber}) لمدة ${data.durationMonths} شهر.

تجد ملف الكفالة مرفق أدناه.

شكراً لثقتك بـ Auto Renew 🚗`;

    const textResult = await this.sendMessage({
      to: data.customerPhone,
      message: textMessage,
    });

    const mediaResult = await this.sendMedia({
      to: data.customerPhone,
      mediaBase64: data.pdfBase64,
      fileName: 'warranty_certificate.pdf',
      caption: 'شهادة كفالة Auto Renew',
    });

    return {
      success: textResult.success || mediaResult.success,
      messageId: mediaResult.messageId || textResult.messageId,
      error: !textResult.success && !mediaResult.success
        ? `Text: ${textResult.error}, Media: ${mediaResult.error}`
        : undefined,
    };
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isEnabled()) {
      return { success: false, message: 'WhatsApp not enabled or not configured' };
    }

    if (this.useWatchimp()) {
      const result = await this.watchimpService.checkConnection();
      return { success: result.success, message: result.message || result.error || 'Watchimp connection test completed' };
    }

    try {
      const response = await axios.get(
        `${this.config.apiUrl}/instance/connectionState/${this.config.instanceName}`,
        {
          headers: {
            'apikey': this.config.apiKey,
          },
        }
      );

      if (response.data && response.data.state === 'open') {
        return { success: true, message: 'WhatsApp connection is active' };
      }

      return { success: false, message: 'WhatsApp connection is not active' };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Connection test failed' 
      };
    }
  }
}