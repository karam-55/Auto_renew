import { Router } from 'express';
import { AccountController } from './controller';
import { postingMapController } from './posting-map.controller';
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

// Map accounting roles to tenant-specific leaf accounts.
router.get('/posting-maps', authorize(['OWNER', 'MANAGER', 'ACCOUNTANT']), postingMapController.getAll);
router.put('/posting-maps/:mappingKey', authorize(['OWNER', 'MANAGER', 'ACCOUNTANT']), postingMapController.update);

// Get account by ID - All authenticated users
router.get('/:id', tenantGuard('Account'), accountController.getAccountById);

// Update account - OWNER, MANAGER, ACCOUNTANT only
router.put('/:id', authorize(['OWNER', 'MANAGER', 'ACCOUNTANT']), tenantGuard('Account'), accountController.updateAccount);

router.post('/:id/balance-adjustments', authorize(['OWNER', 'MANAGER', 'ACCOUNTANT']), tenantGuard('Account'), accountController.adjustBalance);

// Delete account - OWNER, MANAGER only
router.delete('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('Account'), accountController.deleteAccount);

export default router;