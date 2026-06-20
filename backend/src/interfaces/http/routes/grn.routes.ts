import { Router } from 'express';
import { GRNController } from '../controllers/grn.controller';

const router = Router();
const controller = new GRNController();

router.post('/create', controller.create.bind(controller));
router.post('/add-item', controller.addItem.bind(controller));
router.post('/:id/receive', controller.receive.bind(controller));
router.get('/list', controller.list.bind(controller));
router.get('/:id', controller.getById.bind(controller));

export default router;
