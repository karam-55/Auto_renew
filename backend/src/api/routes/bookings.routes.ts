import { Router } from 'express';
import { BookingController } from '../controllers/bookings/booking.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const bookingController = new BookingController();

router.post('/', AuthMiddleware.authenticate, bookingController.create.bind(bookingController));
router.get('/:id', bookingController.findById.bind(bookingController));
router.get('/', AuthMiddleware.authenticate, bookingController.list.bind(bookingController));
router.put('/:id', bookingController.update.bind(bookingController));
router.get('/vehicle/:vehicleId', bookingController.findByVehicle.bind(bookingController));

export default router;
