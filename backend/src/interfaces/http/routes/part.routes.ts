import { Router } from 'express';
import { PartController } from '../controllers/part.controller';

const router = Router();
const controller = new PartController();

router.post('/', controller.create.bind(controller));
router.post('/batch', controller.createMany.bind(controller));
router.get('/', controller.list.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.put('/:id', controller.update.bind(controller));

export default router;
