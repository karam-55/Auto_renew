import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';

const router = Router();
const controller = new PaymentController();

router.post('/', controller.record.bind(controller));
router.post('/:id/refund', controller.refund.bind(controller));

export default router;
