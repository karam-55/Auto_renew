import { Router } from 'express';
import { FCMController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';

const router = Router();
const fcmController = new FCMController();

// All routes require authentication
router.use(authenticate);

// Initialize controller with io (will be set after server starts)
let fcmControllerInstance: FCMController;

export const initFCMRoutes = (io: any) => {
  fcmControllerInstance = new FCMController();
  fcmControllerInstance.setIo(io);
};

// Helper to get controller
const getController = () => {
  if (!fcmControllerInstance) {
    fcmControllerInstance = new FCMController();
  }
  return fcmControllerInstance;
};

// GET /api/fcm - Get user FCM tokens
router.get('/', (req, res) => getController().getUserTokens(req, res));

// ============================================
// CONFIGURATION ENDPOINTS
// ============================================

// Get FCM configuration - OWNER only
router.get('/config', authorize(['OWNER']), (req, res) => getController().getConfig(req, res));

// Update FCM configuration - OWNER only
router.put('/config', authorize(['OWNER']), (req, res) => getController().updateConfig(req, res));

// Test FCM connection - OWNER only
router.post('/test', authorize(['OWNER']), (req, res) => getController().testConnection(req, res));

// ============================================
// TOKEN MANAGEMENT ENDPOINTS
// ============================================

// Register FCM token - All authenticated users
router.post('/tokens/register', (req, res) => getController().registerToken(req, res));

// Unregister FCM token - All authenticated users
router.post('/tokens/unregister', (req, res) => getController().unregisterToken(req, res));

// Get user FCM tokens - All authenticated users
router.get('/tokens', (req, res) => getController().getUserTokens(req, res));

// ============================================
// NOTIFICATION ENDPOINTS
// ============================================

// Send notification to user - OWNER, MANAGER only
router.post('/send', authorize(['OWNER', 'MANAGER']), (req, res) => getController().sendNotification(req, res));

// Send booking assignment notification - OWNER, MANAGER only
router.post('/booking/assignment', authorize(['OWNER', 'MANAGER']), (req, res) => getController().sendBookingAssignment(req, res));

// Send booking status update notification - OWNER, MANAGER only
router.post('/booking/status-update', authorize(['OWNER', 'MANAGER']), (req, res) => getController().sendBookingStatusUpdate(req, res));

export default router;
