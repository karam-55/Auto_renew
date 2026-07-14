import { Router } from 'express';
import { TelegramController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';

const router = Router();
const telegramController = new TelegramController();

// All routes require authentication
router.use(authenticate);

// Get Telegram bot status - accessible by OWNER, MANAGER
router.get('/status', authorize(['OWNER', 'MANAGER']), (req, res) => telegramController.getStatus(req, res));

// Send test message - accessible by OWNER, MANAGER
router.post('/send', authorize(['OWNER', 'MANAGER']), (req, res) => telegramController.sendMessage(req, res));

export default router;
