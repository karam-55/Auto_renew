import { Router } from 'express';
import { BookingImageController } from '../controllers/booking-image.controller';

const router = Router();
const controller = new BookingImageController();

router.post('/', controller.add.bind(controller));
router.delete('/:id', controller.remove.bind(controller));

export default router;
