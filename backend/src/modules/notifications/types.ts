export interface CreateNotificationInput {
  userId?: string;
  title: string;
  titleAr?: string;
  titleEn?: string;
  body: string;
  bodyAr?: string;
  bodyEn?: string;
  type: 'BOOKING_CREATED' | 'BOOKING_UPDATED' | 'BOOKING_COMPLETED' | 'PAYMENT_RECEIVED' | 'INVOICE_SENT' | 'INVENTORY_LOW' | 'PAYROLL_READY' | 'SYSTEM';
}

export interface UpdateNotificationInput {
  isRead?: boolean;
}

export interface NotificationResponse {
  id: string;
  tenantId: string;
  userId: string | null;
  title: string;
  titleAr: string | null;
  titleEn: string | null;
  body: string;
  bodyAr: string | null;
  bodyEn: string | null;
  type: string;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}
