import { Router } from 'express';
import { ChequeController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Initialize controller with io (will be set after server starts)
let chequeController: ChequeController;

export const initChequeRoutes = (io: any) => {
  chequeController = new ChequeController();
  chequeController.setIo(io);
};

// Helper to get controller
const getController = () => {
  if (!chequeController) {
    chequeController = new ChequeController();
  }
  return chequeController;
};

// Create cheque - OWNER, MANAGER, ACCOUNTANT, CASHIER only
router.post('/', authorize(['OWNER', 'MANAGER', 'ACCOUNTANT', 'CASHIER']), (req, res) => getController().createCheque(req, res));

// Get all cheques - All authenticated users
router.get('/', (req, res) => getController().getCheques(req, res));

// Get cheques due soon (within 3 days) - All authenticated users
router.get('/due-soon', (req, res) => getController().getChequesDueSoon(req, res));

// Get overdue cheques - All authenticated users
router.get('/overdue', (req, res) => getController().getOverdueCheques(req, res));

// Get cheque summaries (for list views) - All authenticated users
router.get('/summaries', (req, res) => getController().getChequeSummaries(req, res));

// Get cheque by ID - All authenticated users
router.get('/:id', tenantGuard('Cheque'), (req, res) => getController().getChequeById(req, res));

// Update cheque - OWNER, MANAGER, ACCOUNTANT only
router.put('/:id', authorize(['OWNER', 'MANAGER', 'ACCOUNTANT']), tenantGuard('Cheque'), (req, res) => getController().updateCheque(req, res));

// Deposit cheque - OWNER, MANAGER, ACCOUNTANT, CASHIER only
router.post('/:id/deposit', authorize(['OWNER', 'MANAGER', 'ACCOUNTANT', 'CASHIER']), tenantGuard('Cheque'), (req, res) => getController().depositCheque(req, res));

// Clear cheque - OWNER, MANAGER, ACCOUNTANT only
router.post('/:id/clear', authorize(['OWNER', 'MANAGER', 'ACCOUNTANT']), tenantGuard('Cheque'), (req, res) => getController().clearCheque(req, res));

// Bounce cheque - OWNER, MANAGER, ACCOUNTANT only
router.post('/:id/bounce', authorize(['OWNER', 'MANAGER', 'ACCOUNTANT']), tenantGuard('Cheque'), (req, res) => getController().bounceCheque(req, res));

// Cancel cheque - OWNER, MANAGER only
router.post('/:id/cancel', authorize(['OWNER', 'MANAGER']), tenantGuard('Cheque'), (req, res) => getController().cancelCheque(req, res));

// Get cheque transactions - All authenticated users
router.get('/:id/transactions', tenantGuard('Cheque'), (req, res) => getController().getChequeTransactions(req, res));

// Create cheque transaction - OWNER, MANAGER, ACCOUNTANT only
router.post('/:id/transactions', authorize(['OWNER', 'MANAGER', 'ACCOUNTANT']), tenantGuard('Cheque'), (req, res) => getController().createChequeTransaction(req, res));

export default router;