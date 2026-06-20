import { Router } from 'express';
import { PaymentController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();
const paymentController = new PaymentController();

// All routes require authentication
router.use(authenticate);

// Create payment - OWNER, MANAGER, ACCOUNTANT, CASHIER only
router.post('/', authorize(['OWNER', 'MANAGER', 'ACCOUNTANT', 'CASHIER']), paymentController.createPayment);

// Get all payments - All authenticated users
router.get('/', paymentController.getPayments);

// Get payment summaries (for list views) - All authenticated users
router.get('/summaries', paymentController.getPaymentSummaries);

// Get payment by ID - All authenticated users
router.get('/:id', tenantGuard('Payment'), paymentController.getPaymentById);

// Update payment - OWNER, MANAGER, ACCOUNTANT only
router.put('/:id', authorize(['OWNER', 'MANAGER', 'ACCOUNTANT']), tenantGuard('Payment'), paymentController.updatePayment);

// Delete payment - OWNER, MANAGER only
router.delete('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('Payment'), paymentController.deletePayment);

export default router;