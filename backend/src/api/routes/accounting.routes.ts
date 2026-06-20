import { Router } from 'express';
import { AccountingController } from '../controllers/accounting/accounting.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import depreciationRoutes from '../../modules/accounting/depreciation.routes';

const router = Router();
const accountingController = new AccountingController();

router.use('/depreciation', depreciationRoutes);

// GET /api/accounting - Get accounting overview
router.get('/', AuthMiddleware.authenticate, accountingController.listAccounts.bind(accountingController));

// Account routes
router.post('/accounts', AuthMiddleware.authenticate, accountingController.createAccount.bind(accountingController));
router.post('/accounts/batch', AuthMiddleware.authenticate, accountingController.createManyAccounts.bind(accountingController));
router.get('/accounts', AuthMiddleware.authenticate, accountingController.listAccounts.bind(accountingController));
router.get('/accounts/tree', AuthMiddleware.authenticate, accountingController.getAccountTree.bind(accountingController));

// Journal Entry routes
router.post('/journal-entries', AuthMiddleware.authenticate, accountingController.createJournalEntry.bind(accountingController));
router.get('/journal-entries', accountingController.listJournalEntries.bind(accountingController));

// Customer Account routes
router.get('/customers/:customerId/balance', accountingController.getCustomerBalance.bind(accountingController));
router.get('/customers/:customerId/statement', accountingController.getCustomerStatement.bind(accountingController));

// Supplier Account routes
router.get('/suppliers/:supplierId/balance', accountingController.getSupplierBalance.bind(accountingController));
router.get('/suppliers/:supplierId/statement', accountingController.getSupplierStatement.bind(accountingController));

// Payment routes
router.post('/payments', AuthMiddleware.authenticate, accountingController.createPayment.bind(accountingController));
router.get('/payments/customer/:customerId', accountingController.listPaymentsByCustomer.bind(accountingController));

// Report routes
router.get('/reports/trial-balance', accountingController.getTrialBalance.bind(accountingController));
router.get('/reports/income-statement', accountingController.getIncomeStatement.bind(accountingController));
router.get('/reports/balance-sheet', accountingController.getBalanceSheet.bind(accountingController));

export default router;
