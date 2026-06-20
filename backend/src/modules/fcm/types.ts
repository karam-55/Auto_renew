// ============================================
// FCM NOTIFICATION TYPES
// ============================================

export interface FCMConfig {
  serviceAccountKey: string;
  isEnabled: boolean;
}

export interface FCMToken {
  id: string;
  userId: string;
  tenantId: string;
  token: string;
  deviceType: 'ANDROID' | 'IOS' | 'WEB';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterFCMTokenInput {
  token: string;
  deviceType: 'ANDROID' | 'IOS' | 'WEB';
}

export interface FCMNotification {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface BookingAssignmentNotification {
  mechanicUserId: string;
  bookingId: string;
  customerName: string;
  vehicleMake: string;
  vehicleModel: string;
  scheduledDate: string;
  priority: string;
}

export interface BookingStatusNotification {
  mechanicUserId: string;
  bookingId: string;
  status: string;
  customerName: string;
  vehicleMake: string;
  vehicleModel: string;
}

export interface FCMNotificationResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  errors: string[];
}
