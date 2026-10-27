import { Router } from 'express';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { BuffetController } from './controller';

const router = Router();
const controller = new BuffetController();

router.use(authenticate);
router.use(authorize(['OWNER', 'MANAGER', 'ACCOUNTANT', 'CASHIER']));

router.get('/items', controller.items);
router.get('/items/by-barcode/:code', controller.itemByBarcode);
router.get('/catalog', controller.catalog);
router.put('/items/:id', controller.updateItem);

router.get('/sales', controller.listSales);
router.post('/sales', controller.createSale);
router.get('/sales/:id', controller.getSale);
router.post('/sales/:id/scan', controller.addLine);
router.patch('/sales/:id/lines/:lineId', controller.setLineQuantity);
router.delete('/sales/:id/lines/:lineId', controller.removeLine);
router.post('/sales/:id/cancel', controller.cancelSale);
router.post('/sales/:id/complete', controller.complete);

router.get('/employees', controller.employees);
router.get('/bookings', controller.bookings);
router.get('/debts', controller.debts);
router.post('/debts/:invoiceId/pay', controller.payDebt);

export default router;
