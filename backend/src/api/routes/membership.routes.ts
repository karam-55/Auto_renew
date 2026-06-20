import { Router } from 'express';
import { MembershipPlansController } from '../controllers/membership/membership-plans.controller';
import { CustomerMembershipsController } from '../controllers/membership/customer-memberships.controller';
import { LoyaltyController } from '../controllers/loyalty/loyalty.controller';
import { WalletController } from '../controllers/wallet/wallet.controller';
import { authenticate } from '../../shared/middlewares/auth';
import { auditContextMiddleware } from '../../middleware/audit.middleware';

const router = Router();

const membershipPlansController = new MembershipPlansController();
const customerMembershipsController = new CustomerMembershipsController();
const loyaltyController = new LoyaltyController();
const walletController = new WalletController();

// All routes require authentication
router.use(authenticate);

// Add audit context middleware after authentication
router.use(auditContextMiddleware);

// GET /api/memberships - List membership plans
router.get('/', (req, res) => membershipPlansController.getAllPlans(req, res));

// Membership Plans
router.get('/plans', (req, res) => membershipPlansController.getAllPlans(req, res));
router.post('/plans', (req, res) => membershipPlansController.createPlan(req, res));
router.put('/plans/:id', (req, res) => membershipPlansController.updatePlan(req, res));
router.delete('/plans/:id', (req, res) => membershipPlansController.deletePlan(req, res));

// Customer Memberships
router.get('/customers/:id/memberships', (req, res) => customerMembershipsController.getCustomerMemberships(req, res));
router.post('/customers/:id/memberships/purchase', (req, res) => customerMembershipsController.purchaseMembership(req, res));
router.put('/:id/cancel', (req, res) => customerMembershipsController.cancelMembership(req, res));

// Loyalty Points
router.get('/customers/:id/points', (req, res) => loyaltyController.getCustomerPoints(req, res));
router.get('/customers/:id/points/transactions', (req, res) => loyaltyController.getPointTransactions(req, res));
router.post('/customers/:id/points/redeem', (req, res) => loyaltyController.redeemPoints(req, res));
router.post('/customers/:id/points/add', (req, res) => loyaltyController.addPoints(req, res));
router.get('/customers-with-points', (req, res) => loyaltyController.getAllCustomersWithPoints(req, res));

// Wallet
router.get('/customers/:id/wallet', (req, res) => walletController.getWallet(req, res));
router.post('/customers/:id/wallet/add', (req, res) => walletController.addBalance(req, res));

export default router;
