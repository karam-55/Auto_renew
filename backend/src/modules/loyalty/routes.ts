import { Router } from 'express';
import { LoyaltyController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();
const loyaltyController = new LoyaltyController();

// All routes require authentication
router.use(authenticate);

// Initialize controller with io (will be set after server starts)
let loyaltyControllerInstance: LoyaltyController;

export const initLoyaltyRoutes = (io: any) => {
  loyaltyControllerInstance = new LoyaltyController();
  loyaltyControllerInstance.setIo(io);
};

// Helper to get controller
const getController = () => {
  if (!loyaltyControllerInstance) {
    loyaltyControllerInstance = new LoyaltyController();
  }
  return loyaltyControllerInstance;
};

// GET /api/loyalty - List loyalty rewards
router.get('/', (req, res) => getController().getRewards(req, res));

// ============================================
// LOYALTY POINTS ENDPOINTS
// ============================================

// Add loyalty points - OWNER, MANAGER only
router.post('/points', authorize(['OWNER', 'MANAGER']), (req, res) => getController().addPoints(req, res));

// Get loyalty points - All authenticated users
router.get('/points', (req, res) => getController().getLoyaltyPoints(req, res));

// ============================================
// LOYALTY REWARDS ENDPOINTS
// ============================================

// Create loyalty reward - OWNER, MANAGER only
router.post('/rewards', authorize(['OWNER', 'MANAGER']), (req, res) => getController().createReward(req, res));

// Get all loyalty rewards - All authenticated users
router.get('/rewards', (req, res) => getController().getRewards(req, res));

// Get loyalty reward by ID - All authenticated users
router.get('/rewards/:id', tenantGuard('LoyaltyReward'), (req, res) => getController().getRewardById(req, res));

// Update loyalty reward - OWNER, MANAGER only
router.put('/rewards/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('LoyaltyReward'), (req, res) => getController().updateReward(req, res));

// Delete loyalty reward - OWNER only
router.delete('/rewards/:id', authorize(['OWNER']), tenantGuard('LoyaltyReward'), (req, res) => getController().deleteReward(req, res));

// ============================================
// CUSTOMER LOYALTY SUMMARY ENDPOINT
// ============================================

// Get customer loyalty summary - All authenticated users
router.get('/customers/:customerId/summary', tenantGuard('Customer'), (req, res) => getController().getCustomerLoyaltySummary(req, res));

export default router;
