import { Router } from 'express';
import { StockController } from '../controllers/stock.controller';

const router = Router();
const controller = new StockController();

router.post('/increase', controller.increase.bind(controller));
router.post('/decrease', controller.decrease.bind(controller));
router.post('/adjust', controller.adjust.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.get('/', controller.list.bind(controller));

export default router;
