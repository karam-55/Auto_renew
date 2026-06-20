import { Router } from 'express';
import { WorkOrderController } from '../controllers/workorders/workorder.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const workOrderController = new WorkOrderController();

router.post('/booking/:bookingId', AuthMiddleware.authenticate, workOrderController.createForBooking.bind(workOrderController));

export default router;
