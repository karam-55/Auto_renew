import { Router } from 'express';
import { InvoiceController } from '../controllers/invoices/invoice.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const invoiceController = new InvoiceController();

router.post('/', AuthMiddleware.authenticate, invoiceController.create.bind(invoiceController));
router.get('/:id', invoiceController.findById.bind(invoiceController));
router.get('/', AuthMiddleware.authenticate, invoiceController.list.bind(invoiceController));
router.put('/:id', invoiceController.update.bind(invoiceController));
router.get('/booking/:bookingId', invoiceController.findByBooking.bind(invoiceController));

export default router;
