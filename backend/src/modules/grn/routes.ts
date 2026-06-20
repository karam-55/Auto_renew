import { Router } from 'express';
import { GRNController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();
const grnController = new GRNController();

router.use(authenticate);

router.post('/', authorize(['OWNER', 'MANAGER', 'WAREHOUSE']), grnController.createGRN);

router.get('/', authorize(['OWNER', 'MANAGER', 'WAREHOUSE']), grnController.getGRNs);

router.get('/pending/list', authorize(['OWNER', 'MANAGER', 'WAREHOUSE']), grnController.getPendingGRNs);

router.get('/:id', authorize(['OWNER', 'MANAGER', 'WAREHOUSE']), tenantGuard('GoodsReceiptNote'), grnController.getGRNById);

router.put('/:id', authorize(['OWNER', 'MANAGER', 'WAREHOUSE']), tenantGuard('GoodsReceiptNote'), grnController.updateGRN);

router.delete('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('GoodsReceiptNote'), grnController.deleteGRN);

router.post('/:id/lines', authorize(['OWNER', 'MANAGER', 'WAREHOUSE']), tenantGuard('GoodsReceiptNote'), grnController.addGRNLine);

router.put('/:id/lines/:lineId', authorize(['OWNER', 'MANAGER', 'WAREHOUSE']), tenantGuard('GoodsReceiptNote'), grnController.updateGRNLine);

router.delete('/:id/lines/:lineId', authorize(['OWNER', 'MANAGER', 'WAREHOUSE']), tenantGuard('GoodsReceiptNote'), grnController.removeGRNLine);

router.post('/:id/complete', authorize(['OWNER', 'MANAGER', 'WAREHOUSE']), tenantGuard('GoodsReceiptNote'), grnController.completeGRN);

export default router;
