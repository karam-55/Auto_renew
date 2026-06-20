import { Router } from 'express';
import { InvoiceController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { auditContextMiddleware } from '../../middleware/audit.middleware';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();

// Initialize controller with io (will be set after server starts)
let invoiceControllerInstance: InvoiceController;

export const initInvoiceRoutes = (io: any) => {
  invoiceControllerInstance = new InvoiceController();
  invoiceControllerInstance.setIo(io);
};

// Helper to get controller
const getController = () => {
  if (!invoiceControllerInstance) {
    invoiceControllerInstance = new InvoiceController();
  }
  return invoiceControllerInstance;
};

// All routes require authentication
router.use(authenticate);

// Add audit context middleware after authentication
router.use(auditContextMiddleware);

// Create invoice - OWNER, MANAGER, ACCOUNTANT, CASHIER only
router.post('/', authorize(['OWNER', 'MANAGER', 'ACCOUNTANT', 'CASHIER']), (req, res) => getController().createInvoice(req, res));

// Get all invoices - All authenticated users
router.get('/', (req, res) => getController().getInvoices(req, res));

// Get invoice summaries (for list views) - All authenticated users
router.get('/summaries', (req, res) => getController().getInvoiceSummaries(req, res));

// Get invoice by ID - All authenticated users
router.get('/:id', tenantGuard('Invoice'), (req, res) => getController().getInvoiceById(req, res));

// Update invoice - OWNER, MANAGER, ACCOUNTANT only
router.put('/:id', authorize(['OWNER', 'MANAGER', 'ACCOUNTANT']), tenantGuard('Invoice'), (req, res) => getController().updateInvoice(req, res));

// Finalize invoice (change from DRAFT to ISSUED) - OWNER, MANAGER, ACCOUNTANT only
router.post('/:id/finalize', authorize(['OWNER', 'MANAGER', 'ACCOUNTANT']), tenantGuard('Invoice'), (req, res) => getController().finalizeInvoice(req, res));

// Cancel invoice (change from SENT/ISSUED to CANCELLED) - OWNER, MANAGER, ACCOUNTANT only
router.post('/:id/cancel', authorize(['OWNER', 'MANAGER', 'ACCOUNTANT']), tenantGuard('Invoice'), (req, res) => getController().cancelInvoice(req, res));

// Pay invoice (change from SENT/ISSUED to PAID) - OWNER, MANAGER, ACCOUNTANT, CASHIER only
router.post('/:id/pay', authorize(['OWNER', 'MANAGER', 'ACCOUNTANT', 'CASHIER']), tenantGuard('Invoice'), (req, res) => getController().payInvoice(req, res));

// Delete invoice - OWNER, MANAGER only
router.delete('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('Invoice'), (req, res) => getController().deleteInvoice(req, res));

export default router;