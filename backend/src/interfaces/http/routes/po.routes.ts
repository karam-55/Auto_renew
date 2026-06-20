import { Router } from 'express';
import { POController } from '../controllers/po.controller';

const router = Router();
const controller = new POController();

router.post('/create', controller.create.bind(controller));
router.post('/add-item', controller.addItem.bind(controller));
router.delete('/items/:id', controller.removeItem.bind(controller));
router.post('/:id/submit', controller.submit.bind(controller));
router.post('/:id/cancel', controller.cancel.bind(controller));
router.get('/list', controller.list.bind(controller));
router.get('/:id', controller.getById.bind(controller));

export default router;
