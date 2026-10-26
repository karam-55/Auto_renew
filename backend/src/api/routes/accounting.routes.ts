import { Router } from 'express';
import { AccountingController } from '../controllers/accounting/accounting.controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { AccountController } from '../../modules/accounts/controller';
import depreciationRoutes from '../../modules/accounting/depreciation.routes';

const router = Router();
const accountingController = new AccountingController();
const accountController = new AccountController();
const FINANCE_ROLES = ['OWNER', 'MANAGER', 'ACCOUNTANT'];

router.use(authenticate);
router.use('/depreciation', depreciationRoutes);

// GET /api/accounting - Get accounting overview
router.get('/', accountController.getAccounts);

// Account routes
router.post('/accounts', authorize(FINANCE_ROLES), accountController.createAccount);
router.post('/accounts/batch', authorize(FINANCE_ROLES), accountingController.createManyAccounts.bind(accountingController));
router.get('/accounts', accountController.getAccounts);
router.get('/accounts/tree', accountController.getAccountTree);

// Journal Entry routes
router.post('/journal-entries', authorize(FINANCE_ROLES), accountingController.createJournalEntry.bind(accountingController));
router.get('/journal-entries', authorize(FINANCE_ROLES), accountingController.listJournalEntries.bind(accountingController));

// Customer Account routes
router.get('/customers/:customerId/balance', authorize(FINANCE_ROLES), accountingController.getCustomerBalance.bind(accountingController));
router.get('/customers/:customerId/statement', authorize(FINANCE_ROLES), accountingController.getCustomerStatement.bind(accountingController));

// Supplier Account routes
router.get('/suppliers/:supplierId/balance', authorize(FINANCE_ROLES), accountingController.getSupplierBalance.bind(accountingController));
router.get('/suppliers/:supplierId/statement', authorize(FINANCE_ROLES), accountingController.getSupplierStatement.bind(accountingController));

// Payment routes
router.post('/payments', authorize(FINANCE_ROLES), accountingController.createPayment.bind(accountingController));
router.get('/payments/customer/:customerId', authorize(FINANCE_ROLES), accountingController.listPaymentsByCustomer.bind(accountingController));

// Report routes
router.get('/reports/trial-balance', authorize(FINANCE_ROLES), accountingController.getTrialBalance.bind(accountingController));
router.get('/reports/income-statement', authorize(FINANCE_ROLES), accountingController.getIncomeStatement.bind(accountingController));
router.get('/reports/balance-sheet', authorize(FINANCE_ROLES), accountingController.getBalanceSheet.bind(accountingController));

export default router;
