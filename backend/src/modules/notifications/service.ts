import prisma from '../../config/database';
import { CreateNotificationInput, UpdateNotificationInput, NotificationResponse } from './types';
import { NotificationType } from '@prisma/client';

export class NotificationService {
  private io: any;

  constructor(io?: any) {
    this.io = io;
  }

  async getAllNotifications(tenantId: string, userId: string, filters?: {
    isRead?: boolean;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<{ notifications: NotificationResponse[], total: number }> {
    const where: any = { tenantId, userId };

    if (filters?.isRead !== undefined) {
      where.isRead = filters.isRead;
    }
    if (filters?.type) {
      where.type = filters.type as NotificationType;
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return { notifications, total };
  }

  async getNotificationById(tenantId: string, notificationId: string, userId: string): Promise<NotificationResponse | null> {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, tenantId, userId },
    });

    return notification;
  }

  async getUnreadCount(tenantId: string, userId: string): Promise<number> {
    const count = await prisma.notification.count({
      where: { tenantId, userId, isRead: false },
    });

    return count;
  }

  async createNotification(tenantId: string, data: CreateNotificationInput): Promise<NotificationResponse> {
    // Verify user exists and belongs to tenant
    if (data.userId) {
      const user = await prisma.user.findFirst({
        where: { id: data.userId, tenantId },
      });

      if (!user) {
        throw new Error('User not found');
      }
    }

    const notification = await prisma.notification.create({
      data: {
        tenantId,
        userId: data.userId,
        title: data.title,
        titleAr: data.titleAr,
        titleEn: data.titleEn,
        body: data.body,
        bodyAr: data.bodyAr,
        bodyEn: data.bodyEn,
        type: data.type as NotificationType,
      },
    });

    // Emit Socket.io notification to the user
    if (this.io && data.userId) {
      this.io.to(`user:${data.userId}`).emit('notification:new', {
        id: notification.id,
        title: notification.title,
        body: notification.body,
        type: notification.type,
        createdAt: notification.createdAt,
      });
    }

    return notification;
  }

  async markAsRead(tenantId: string, notificationId: string, userId: string): Promise<NotificationResponse> {
    // Check if notification exists and belongs to user
    const existingNotification = await prisma.notification.findFirst({
      where: { id: notificationId, tenantId, userId },
    });

    if (!existingNotification) {
      throw new Error('Notification not found');
    }

    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });

    return notification;
  }

  async markAllAsRead(tenantId: string, userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { tenantId, userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async deleteNotification(tenantId: string, notificationId: string, userId: string): Promise<void> {
    // Check if notification exists and belongs to user
    const existingNotification = await prisma.notification.findFirst({
      where: { id: notificationId, tenantId, userId },
    });

    if (!existingNotification) {
      throw new Error('Notification not found');
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  async broadcastToTenant(tenantId: string, title: string, body: string, type: NotificationType, data?: any): Promise<void> {
    // Get all active users in the tenant
    const users = await prisma.user.findMany({
      where: { tenantId, isActive: true },
      select: { id: true },
    });

    // Create notification for each user
    const notifications = await prisma.notification.createMany({
      data: users.map(user => ({
        tenantId,
        userId: user.id,
        title,
        body,
        type,
      })),
    });

    // Emit Socket.io notification to tenant channel
    if (this.io) {
      this.io.to(`tenant:${tenantId}`).emit('notification:broadcast', {
        title,
        body,
        type,
        data,
      });
    }
  }

  async broadcastToRole(tenantId: string, role: string, title: string, body: string, type: NotificationType, data?: any): Promise<void> {
    // Get all active users with the specified role in the tenant
    const users = await prisma.user.findMany({
      where: { tenantId, role: role as any, isActive: true },
      select: { id: true },
    });

    // Create notification for each user
    await prisma.notification.createMany({
      data: users.map(user => ({
        tenantId,
        userId: user.id,
        title,
        body,
        type,
      })),
    });

    // Emit Socket.io notification to tenant channel (filtered by role on client)
    if (this.io) {
      this.io.to(`tenant:${tenantId}`).emit('notification:broadcast', {
        title,
        body,
        type,
        role,
        data,
      });
    }
  }
}
