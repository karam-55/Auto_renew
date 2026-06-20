import { Router } from 'express';
import { BookingApprovalController } from '../controllers/booking-approval.controller';

const router = Router();
const controller = new BookingApprovalController();

router.post('/:bookingId/approve', controller.approve.bind(controller));
router.post('/:bookingId/reject', controller.reject.bind(controller));

export default router;
