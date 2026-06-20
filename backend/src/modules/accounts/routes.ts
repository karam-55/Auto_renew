import { Router } from 'express';
import { AccountController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();
const accountController = new AccountController();

// All routes require authentication
router.use(authenticate);

// Create account - OWNER, MANAGER, ACCOUNTANT only
router.post('/', authorize(['OWNER', 'MANAGER', 'ACCOUNTANT']), accountController.createAccount);

// Get all accounts - All authenticated users
router.get('/', accountController.getAccounts);

// Get account tree - All authenticated users
router.get('/tree', accountController.getAccountTree);

// Get account balances - OWNER, MANAGER, ACCOUNTANT only
router.get('/balances', authorize(['OWNER', 'MANAGER', 'ACCOUNTANT']), accountController.getAccountBalances);

// Get account by ID - All authenticated users
router.get('/:id', tenantGuard('Account'), accountController.getAccountById);

// Update account - OWNER, MANAGER, ACCOUNTANT only
router.put('/:id', authorize(['OWNER', 'MANAGER', 'ACCOUNTANT']), tenantGuard('Account'), accountController.updateAccount);

// Delete account - OWNER, MANAGER only
router.delete('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('Account'), accountController.deleteAccount);

export default router;