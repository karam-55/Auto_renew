import { Router } from 'express';
import { FiscalPeriodController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();
const fiscalPeriodController = new FiscalPeriodController();

// All routes require authentication
router.use(authenticate);

// Create fiscal period - OWNER, MANAGER, ACCOUNTANT only
router.post('/', authorize(['OWNER', 'MANAGER', 'ACCOUNTANT']), fiscalPeriodController.createFiscalPeriod);

// Get all fiscal periods - All authenticated users
router.get('/', fiscalPeriodController.getFiscalPeriods);

// Get current fiscal period - All authenticated users
router.get('/current', fiscalPeriodController.getCurrentFiscalPeriod);

// Get fiscal period summary - OWNER, MANAGER, ACCOUNTANT only
router.get('/:id/summary', authorize(['OWNER', 'MANAGER', 'ACCOUNTANT']), tenantGuard('FiscalPeriod'), fiscalPeriodController.getFiscalPeriodSummary);

// Get fiscal period by ID - All authenticated users
router.get('/:id', tenantGuard('FiscalPeriod'), fiscalPeriodController.getFiscalPeriodById);

// Update fiscal period - OWNER, MANAGER, ACCOUNTANT only
router.put('/:id', authorize(['OWNER', 'MANAGER', 'ACCOUNTANT']), tenantGuard('FiscalPeriod'), fiscalPeriodController.updateFiscalPeriod);

// Close fiscal period - OWNER, MANAGER only
router.post('/:id/close', authorize(['OWNER', 'MANAGER']), tenantGuard('FiscalPeriod'), fiscalPeriodController.closeFiscalPeriod);

// Reopen fiscal period - OWNER, MANAGER only
router.post('/:id/reopen', authorize(['OWNER', 'MANAGER']), tenantGuard('FiscalPeriod'), fiscalPeriodController.reopenFiscalPeriod);

// Delete fiscal period - OWNER, MANAGER only
router.delete('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('FiscalPeriod'), fiscalPeriodController.deleteFiscalPeriod);

export default router;