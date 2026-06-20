import { Router } from 'express';
import { WhatsAppController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';

const router = Router();
const whatsappController = new WhatsAppController();

// All routes require authentication
router.use(authenticate);

// Initialize controller with io (will be set after server starts)
let whatsappControllerInstance: WhatsAppController;

export const initWhatsAppRoutes = (io: any) => {
  whatsappControllerInstance = new WhatsAppController();
  whatsappControllerInstance.setIo(io);
};

// Helper to get controller
const getController = () => {
  if (!whatsappControllerInstance) {
    whatsappControllerInstance = new WhatsAppController();
  }
  return whatsappControllerInstance;
};

// ============================================
// MESSAGE LOG ENDPOINTS
// ============================================

// Get WhatsApp message history - accessible by OWNER, MANAGER
router.get('/messages', authorize(['OWNER', 'MANAGER']), (req, res) => getController().getMessages(req, res));

// ============================================
// CONFIGURATION ENDPOINTS
// ============================================

// Get WhatsApp configuration - OWNER only
router.get('/config', authorize(['OWNER']), (req, res) => getController().getConfig(req, res));

// Update WhatsApp configuration - OWNER only
router.put('/config', authorize(['OWNER']), (req, res) => getController().updateConfig(req, res));

// Test WhatsApp connection - OWNER only
router.post('/test', authorize(['OWNER']), (req, res) => getController().testConnection(req, res));

// ============================================
// BOOKING NOTIFICATIONS ENDPOINTS
// ============================================

// Send booking confirmation - OWNER, MANAGER only
router.post('/booking/confirmation', authorize(['OWNER', 'MANAGER']), (req, res) => getController().sendBookingConfirmation(req, res));

// Send booking status update - OWNER, MANAGER only
router.post('/booking/status-update', authorize(['OWNER', 'MANAGER']), (req, res) => getController().sendBookingStatusUpdate(req, res));

// ============================================
// INSTALLMENT NOTIFICATIONS ENDPOINTS
// ============================================

// Send installment reminder - OWNER, MANAGER only
router.post('/installment/reminder', authorize(['OWNER', 'MANAGER']), (req, res) => getController().sendInstallmentReminder(req, res));

// Send installment overdue - OWNER, MANAGER only
router.post('/installment/overdue', authorize(['OWNER', 'MANAGER']), (req, res) => getController().sendInstallmentOverdue(req, res));

// ============================================
// INVOICE NOTIFICATIONS ENDPOINTS
// ============================================

// Send invoice notification - OWNER, MANAGER only
router.post('/invoice/notification', authorize(['OWNER', 'MANAGER']), (req, res) => getController().sendInvoiceNotification(req, res));

// Send payment confirmation - OWNER, MANAGER only
router.post('/invoice/payment-confirmation', authorize(['OWNER', 'MANAGER']), (req, res) => getController().sendPaymentConfirmation(req, res));

// ============================================
// LOYALTY NOTIFICATIONS ENDPOINTS
// ============================================

// Send loyalty points earned - OWNER, MANAGER only
router.post('/loyalty/points-earned', authorize(['OWNER', 'MANAGER']), (req, res) => getController().sendLoyaltyPointsEarned(req, res));

// Send loyalty tier upgrade - OWNER, MANAGER only
router.post('/loyalty/tier-upgrade', authorize(['OWNER', 'MANAGER']), (req, res) => getController().sendLoyaltyTierUpgrade(req, res));

// ============================================
// MAINTENANCE REMINDER ENDPOINT
// ============================================

// Send maintenance reminder - OWNER, MANAGER only
router.post('/maintenance/reminder', authorize(['OWNER', 'MANAGER']), (req, res) => getController().sendMaintenanceReminder(req, res));

export default router;
