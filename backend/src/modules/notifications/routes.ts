import { Router } from 'express';
import { NotificationController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all notifications for current user (accessible by all authenticated users)
router.get('/', (req, res) => {
  const controller = new NotificationController(req.app.get('io'));
  controller.getAllNotifications(req, res);
});

// Get unread count for current user (accessible by all authenticated users)
router.get('/unread-count', (req, res) => {
  const controller = new NotificationController(req.app.get('io'));
  controller.getUnreadCount(req, res);
});

// Get notification by ID (accessible by all authenticated users)
router.get('/:id', tenantGuard('Notification'), (req, res) => {
  const controller = new NotificationController(req.app.get('io'));
  controller.getNotificationById(req, res);
});

// Create notification (accessible by OWNER, MANAGER)
router.post('/', authorize(['OWNER', 'MANAGER']), (req, res) => {
  const controller = new NotificationController(req.app.get('io'));
  controller.createNotification(req, res);
});

// Mark notification as read (accessible by all authenticated users)
router.patch('/:id/read', tenantGuard('Notification'), (req, res) => {
  const controller = new NotificationController(req.app.get('io'));
  controller.markAsRead(req, res);
});

// Mark all notifications as read (accessible by all authenticated users)
router.patch('/read-all', (req, res) => {
  const controller = new NotificationController(req.app.get('io'));
  controller.markAllAsRead(req, res);
});

// Delete notification (accessible by all authenticated users)
router.delete('/:id', tenantGuard('Notification'), (req, res) => {
  const controller = new NotificationController(req.app.get('io'));
  controller.deleteNotification(req, res);
});

// Broadcast to tenant (accessible by OWNER, MANAGER)
router.post('/broadcast/tenant', authorize(['OWNER', 'MANAGER']), (req, res) => {
  const controller = new NotificationController(req.app.get('io'));
  controller.broadcastToTenant(req, res);
});

// Broadcast to role (accessible by OWNER, MANAGER)
router.post('/broadcast/role', authorize(['OWNER', 'MANAGER']), (req, res) => {
  const controller = new NotificationController(req.app.get('io'));
  controller.broadcastToRole(req, res);
});

export default router;
