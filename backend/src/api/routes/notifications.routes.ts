import { Router } from 'express';
import { NotificationsController } from '../controllers/notifications/notifications.controller';
import { AuthMiddleware, UserRole } from '../middlewares/auth.middleware';

const router = Router();
const notificationsController = new NotificationsController();

// All routes require authentication
router.use(AuthMiddleware.authenticate);

// Get WhatsApp messages log (accessible by ADMIN, MANAGER)
router.get('/whatsapp/messages', AuthMiddleware.authorize(UserRole.ADMIN, UserRole.MANAGER), notificationsController.getWhatsAppMessages.bind(notificationsController));

export default router;
