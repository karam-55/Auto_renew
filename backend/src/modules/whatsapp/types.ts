// ============================================
// WHATSAPP NOTIFICATION TYPES
// ============================================

export interface WhatsAppConfig {
  apiKey: string;
  apiUrl: string;
  instanceName: string;
  isEnabled: boolean;
}

export interface WhatsAppMessage {
  to: string; // Phone number with country code
  message: string;
  template?: string;
  templateData?: Record<string, any>;
}

export interface BookingNotificationData {
  customerName: string;
  customerPhone: string;
  bookingId: string;
  vehicleMake: string;
  vehicleModel: string;
  scheduledDate: string;
  status: string;
  garageName: string;
}

export interface InstallmentReminderData {
  customerName: string;
  customerPhone: string;
  installmentAmount: number;
  dueDate: string;
  invoiceNumber: string;
  garageName: string;
}

export interface InvoiceNotificationData {
  customerName: string;
  customerPhone: string;
  invoiceNumber: string;
  totalAmount: number;
  dueDate: string;
  garageName: string;
}

export interface WhatsAppNotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface WhatsAppTemplate {
  name: string;
  language: string;
  components: any[];
}
