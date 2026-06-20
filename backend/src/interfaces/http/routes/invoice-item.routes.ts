import { Router } from 'express';
import { InvoiceItemController } from '../controllers/invoice-item.controller';

const router = Router();
const controller = new InvoiceItemController();

router.post('/', controller.add.bind(controller));
router.delete('/:id', controller.remove.bind(controller));

export default router;
