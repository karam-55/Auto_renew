import prisma from '../../config/database';

/**
 * In-App Notification Service
 * Manages in-app notifications for users
 * 
 * Notifications are stored in the database and retrieved by the frontend
 */

export interface InAppNotification {
  id: string;
  tenantId: string;
  userId: string | null;
  title: string;
  titleAr?: string;
  body: string;
  bodyAr?: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
}

export class InAppNotificationService {
  /**
   * Create a new in-app notification
   */
  async createNotification(
    tenantId: string,
    userId: string,
    title: string,
    titleAr: string | undefined,
    body: string,
    bodyAr: string | undefined,
    type: string
  ): Promise<InAppNotification> {
    const notification = await prisma.notification.create({
      data: {
        tenantId,
        userId,
        title,
        titleAr,
        body,
        bodyAr,
        type: type as any,
        isRead: false
      }
    });

    return {
      id: notification.id,
      tenantId: notification.tenantId,
      userId: notification.userId,
      title: notification.title,
      titleAr: notification.titleAr || undefined,
      body: notification.body,
      bodyAr: notification.bodyAr || undefined,
      type: notification.type,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      readAt: notification.readAt || undefined
    };
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    unreadOnly: boolean = false,
    limit: number = 50,
    offset: number = 0
  ): Promise<InAppNotification[]> {
    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    return notifications.map(n => ({
      id: n.id,
      tenantId: n.tenantId,
      userId: n.userId,
      title: n.title,
      titleAr: n.titleAr || undefined,
      body: n.body,
      bodyAr: n.bodyAr || undefined,
      type: n.type,
      isRead: n.isRead,
      createdAt: n.createdAt,
      readAt: n.readAt || undefined
    }));
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<InAppNotification> {
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return {
      id: notification.id,
      tenantId: notification.tenantId,
      userId: notification.userId,
      title: notification.title,
      titleAr: notification.titleAr || undefined,
      body: notification.body,
      bodyAr: notification.bodyAr || undefined,
      type: notification.type,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      readAt: notification.readAt || undefined
    };
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return result.count;
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    await prisma.notification.delete({
      where: { id: notificationId }
    });
    return true;
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });

    return count;
  }

  /**
   * Create booking notification
   */
  async createBookingNotification(
    tenantId: string,
    userId: string,
    bookingId: string,
    bookingNumber: string,
    status: string
  ): Promise<InAppNotification> {
    const title = `Booking ${bookingNumber} Updated`;
    const titleAr = `تم تحديث الحجز ${bookingNumber}`;
    const body = `Your booking status has been updated to: ${status}`;
    const bodyAr = `تم تحديث حالة حجزك إلى: ${status}`;

    return await this.createNotification(
      tenantId,
      userId,
      title,
      titleAr,
      body,
      bodyAr,
      'BOOKING'
    );
  }

  /**
   * Create payment notification
   */
  async createPaymentNotification(
    tenantId: string,
    userId: string,
    invoiceId: string,
    invoiceNumber: string,
    amount: number,
    currency: string
  ): Promise<InAppNotification> {
    const title = `Payment Received for Invoice ${invoiceNumber}`;
    const titleAr = `تم استلام دفع للفاتورة ${invoiceNumber}`;
    const body = `Payment of ${amount} ${currency} has been received`;
    const bodyAr = `تم استلام دفع بقيمة ${amount} ${currency}`;

    return await this.createNotification(
      tenantId,
      userId,
      title,
      titleAr,
      body,
      bodyAr,
      'PAYMENT'
    );
  }

  /**
   * Create system notification
   */
  async createSystemNotification(
    tenantId: string,
    userId: string,
    title: string,
    titleAr: string | undefined,
    body: string,
    bodyAr: string | undefined
  ): Promise<InAppNotification> {
    return await this.createNotification(
      tenantId,
      userId,
      title,
      titleAr,
      body,
      bodyAr,
      'SYSTEM'
    );
  }

  /**
   * Get notification summary for dashboard
   */
  async getNotificationSummary(userId: string): Promise<{
    totalNotifications: number;
    unreadNotifications: number;
    recentNotifications: InAppNotification[];
  }> {
    const totalNotifications = await prisma.notification.count({
      where: { userId }
    });

    const unreadNotifications = await this.getUnreadCount(userId);

    const recentNotifications = await this.getUserNotifications(userId, false, 5);

    return {
      totalNotifications,
      unreadNotifications,
      recentNotifications
    };
  }
}

export default new InAppNotificationService();
