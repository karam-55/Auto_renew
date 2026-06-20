import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller';

const router = Router();
const controller = new InvoiceController();

router.post('/', controller.create.bind(controller));
router.get('/', controller.list.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.put('/:id', controller.update.bind(controller));

export default router;
