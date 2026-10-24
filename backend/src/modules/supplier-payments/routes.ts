import { Router } from 'express';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';
import { supplierPaymentController } from './controller';

const router = Router();
router.use(authenticate);

router.get(
  '/suppliers/:supplierId/statement',
  authorize(['OWNER', 'MANAGER', 'ACCOUNTANT']),
  tenantGuard('Supplier'),
  supplierPaymentController.statement,
);
router.post(
  '/',
  authorize(['OWNER', 'MANAGER', 'ACCOUNTANT']),
  supplierPaymentController.create,
);

export default router;
