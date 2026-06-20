import { Router } from 'express';
import { SettingsController } from '../controllers/settings/settings.controller';
import { requirePermission } from '../../middleware/permission.middleware';
import { authenticate } from '../../shared/middlewares/auth';
import { auditContextMiddleware } from '../../middleware/audit.middleware';

const router = Router();
const settingsController = new SettingsController();

// Public endpoint - no auth required
router.get('/public', settingsController.getPublicSettings.bind(settingsController));

// Protected endpoints - require authentication
router.use(authenticate);

// Add audit context middleware after authentication
router.use(auditContextMiddleware);

// Protected endpoints - require manage_settings permission
const manageSettings = requirePermission('manage_settings');

// GET /api/settings - Get full settings
router.get('/', manageSettings, settingsController.getSettings.bind(settingsController));

// PUT /api/settings - Update settings
router.put('/', manageSettings, settingsController.updateSettings.bind(settingsController));

// Legacy endpoints for backward compatibility
router.get('/notifications', manageSettings, settingsController.getNotificationSettings.bind(settingsController));
router.put('/notifications', manageSettings, settingsController.updateNotificationSettings.bind(settingsController));

export default router;
