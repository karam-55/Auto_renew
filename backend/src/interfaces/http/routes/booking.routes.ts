import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';

const router = Router();
const controller = new BookingController();

router.post('/', controller.create.bind(controller));
router.get('/', controller.list.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.put('/:id', controller.update.bind(controller));
router.patch('/:id/status', controller.changeBookingStatus.bind(controller));

export default router;
