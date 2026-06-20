import { Router } from 'express';
import { BookingServiceController } from '../controllers/booking-service.controller';

const router = Router();
const controller = new BookingServiceController();

router.post('/', controller.add.bind(controller));
router.delete('/:id', controller.remove.bind(controller));

export default router;
