import { Router } from 'express';
import { ExpensesController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get expense summary (accessible by OWNER, MANAGER)
router.get('/summary', authorize(['OWNER', 'MANAGER']), (req, res) => {
  const controller = new ExpensesController();
  controller.getExpenseSummary(req, res);
});

// Get expense categories (accessible by all authenticated users)
router.get('/categories', (req, res) => {
  const controller = new ExpensesController();
  controller.getExpenseCategories(req, res);
});

// Get expense trend (accessible by OWNER, MANAGER)
router.get('/trend', authorize(['OWNER', 'MANAGER']), (req, res) => {
  const controller = new ExpensesController();
  controller.getExpenseTrend(req, res);
});

// Get expense report (accessible by OWNER, MANAGER)
router.get('/report', authorize(['OWNER', 'MANAGER']), (req, res) => {
  const controller = new ExpensesController();
  controller.getExpenseReport(req, res);
});

// Create expense (accessible by OWNER, MANAGER)
router.post('/', authorize(['OWNER', 'MANAGER']), (req, res) => {
  const controller = new ExpensesController();
  controller.createExpense(req, res);
});

// Get expenses for tenant (accessible by OWNER, MANAGER)
router.get('/', authorize(['OWNER', 'MANAGER']), (req, res) => {
  const controller = new ExpensesController();
  controller.getExpenses(req, res);
});

// Get expense by ID (accessible by all authenticated users)
router.get('/:id', tenantGuard('Expense'), (req, res) => {
  const controller = new ExpensesController();
  controller.getExpense(req, res);
});

// Approve expense (accessible by OWNER, MANAGER)
router.post('/:id/approve', authorize(['OWNER', 'MANAGER']), tenantGuard('Expense'), (req, res) => {
  const controller = new ExpensesController();
  controller.approveExpense(req, res);
});

// Delete expense (accessible by OWNER, MANAGER)
router.delete('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('Expense'), (req, res) => {
  const controller = new ExpensesController();
  controller.deleteExpense(req, res);
});

export default router;
