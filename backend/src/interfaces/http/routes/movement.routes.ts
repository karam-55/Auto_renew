import { Router } from 'express';
import { MovementController } from '../controllers/movement.controller';

const router = Router();
const controller = new MovementController();

router.post('/', controller.record.bind(controller));
router.get('/', controller.list.bind(controller));

export default router;
