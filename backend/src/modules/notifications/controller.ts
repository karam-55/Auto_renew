import { Request, Response } from 'express';
import { NotificationService } from './service';
import { AuthRequest } from '../../shared/middlewares/auth';
import { Logger } from '../../infrastructure/logging/logger';

export class NotificationController {
  private notificationService: NotificationService;

  constructor(io?: any) {
    this.notificationService = new NotificationService(io);
  }

  getAllNotifications = async (req: AuthRequest, res: Response) => {
    try {
      const filters: any = {};
      if (req.query.isRead !== undefined) filters.isRead = req.query.isRead === 'true';
      if (req.query.type) filters.type = req.query.type as string;

      const notifications = await this.notificationService.getAllNotifications(
        req.user!.tenantId,
        req.user!.id,
        filters
      );
      res.json({ notifications });
    } catch (error) {
      Logger.error('Get all notifications error:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  };

  getNotificationById = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const notification = await this.notificationService.getNotificationById(
        req.user!.tenantId,
        id,
        req.user!.id
      );

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      res.json({ notification });
    } catch (error) {
      Logger.error('Get notification error:', error);
      res.status(500).json({ error: 'Failed to fetch notification' });
    }
  };

  getUnreadCount = async (req: AuthRequest, res: Response) => {
    try {
      const count = await this.notificationService.getUnreadCount(req.user!.tenantId, req.user!.id);
      res.json({ count });
    } catch (error) {
      Logger.error('Get unread count error:', error);
      res.status(500).json({ error: 'Failed to fetch unread count' });
    }
  };

  createNotification = async (req: AuthRequest, res: Response) => {
    try {
      const notification = await this.notificationService.createNotification(req.user!.tenantId, req.body);
      res.status(201).json({ notification });
    } catch (error: any) {
      Logger.error('Create notification error:', error);
      res.status(400).json({ error: error.message || 'Failed to create notification' });
    }
  };

  markAsRead = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const notification = await this.notificationService.markAsRead(
        req.user!.tenantId,
        id,
        req.user!.id
      );
      res.json({ notification });
    } catch (error: any) {
      Logger.error('Mark as read error:', error);
      res.status(400).json({ error: error.message || 'Failed to mark notification as read' });
    }
  };

  markAllAsRead = async (req: AuthRequest, res: Response) => {
    try {
      await this.notificationService.markAllAsRead(req.user!.tenantId, req.user!.id);
      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      Logger.error('Mark all as read error:', error);
      res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
  };

  deleteNotification = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await this.notificationService.deleteNotification(req.user!.tenantId, id, req.user!.id);
      res.json({ message: 'Notification deleted successfully' });
    } catch (error: any) {
      Logger.error('Delete notification error:', error);
      res.status(400).json({ error: error.message || 'Failed to delete notification' });
    }
  };

  broadcastToTenant = async (req: AuthRequest, res: Response) => {
    try {
      const { title, body, type, data } = req.body;
      await this.notificationService.broadcastToTenant(
        req.user!.tenantId,
        title,
        body,
        type,
        data
      );
      res.json({ message: 'Broadcast sent successfully' });
    } catch (error: any) {
      Logger.error('Broadcast to tenant error:', error);
      res.status(400).json({ error: error.message || 'Failed to send broadcast' });
    }
  };

  broadcastToRole = async (req: AuthRequest, res: Response) => {
    try {
      const { role, title, body, type, data } = req.body;
      await this.notificationService.broadcastToRole(
        req.user!.tenantId,
        role,
        title,
        body,
        type,
        data
      );
      res.json({ message: 'Broadcast sent successfully' });
    } catch (error: any) {
      Logger.error('Broadcast to role error:', error);
      res.status(400).json({ error: error.message || 'Failed to send broadcast' });
    }
  };
}
