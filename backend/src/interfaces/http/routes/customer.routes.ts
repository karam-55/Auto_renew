import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';

const router = Router();
const controller = new CustomerController();

router.post('/', controller.create.bind(controller));
router.post('/batch', controller.createMany.bind(controller));
router.get('/', controller.list.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.put('/:id', controller.update.bind(controller));
router.delete('/:id', controller.delete.bind(controller));

export default router;
