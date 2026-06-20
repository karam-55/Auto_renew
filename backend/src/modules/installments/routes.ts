import { Router } from 'express';
import { InstallmentController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Initialize controller with io (will be set after server starts)
let installmentController: InstallmentController;

export const initInstallmentRoutes = (io: any) => {
  installmentController = new InstallmentController();
  installmentController.setIo(io);
};

// Helper to get controller
const getController = () => {
  if (!installmentController) {
    installmentController = new InstallmentController();
  }
  return installmentController;
};

// GET /api/installments - List all installment plans
router.get('/', (req, res) => getController().getInstallmentPlans(req, res));

// Create installment plan - OWNER, MANAGER, ACCOUNTANT only
router.post('/plans', authorize(['OWNER', 'MANAGER', 'ACCOUNTANT']), (req, res) => getController().createInstallmentPlan(req, res));

// Get all installment plans - All authenticated users
router.get('/plans', (req, res) => getController().getInstallmentPlans(req, res));

// Get installment plan summaries (for list views) - All authenticated users
router.get('/plans/summaries', (req, res) => getController().getInstallmentPlanSummaries(req, res));

// Get installment plan by ID - All authenticated users
router.get('/plans/:id', tenantGuard('InstallmentPlan'), (req, res) => getController().getInstallmentPlanById(req, res));

// Update installment plan - OWNER, MANAGER, ACCOUNTANT only
router.put('/plans/:id', authorize(['OWNER', 'MANAGER', 'ACCOUNTANT']), tenantGuard('InstallmentPlan'), (req, res) => getController().updateInstallmentPlan(req, res));

// Pay down payment - OWNER, MANAGER, ACCOUNTANT, CASHIER only
router.post('/plans/:id/down-payment', authorize(['OWNER', 'MANAGER', 'ACCOUNTANT', 'CASHIER']), tenantGuard('InstallmentPlan'), (req, res) => getController().payDownPayment(req, res));

// Cancel installment plan - OWNER, MANAGER only
router.post('/plans/:id/cancel', authorize(['OWNER', 'MANAGER']), tenantGuard('InstallmentPlan'), (req, res) => getController().cancelInstallmentPlan(req, res));

// Pay installment - OWNER, MANAGER, ACCOUNTANT, CASHIER only
router.post('/installments/:id/pay', authorize(['OWNER', 'MANAGER', 'ACCOUNTANT', 'CASHIER']), tenantGuard('Installment'), (req, res) => getController().payInstallment(req, res));

// Get overdue installments - All authenticated users
router.get('/installments/overdue', (req, res) => getController().getOverdueInstallments(req, res));

// Get installments due soon (within 7 days) - All authenticated users
router.get('/installments/due-soon', (req, res) => getController().getInstallmentsDueSoon(req, res));

export default router;