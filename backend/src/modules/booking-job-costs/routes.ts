import { Router } from 'express';
import { bookingJobCostController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/booking/:bookingId', bookingJobCostController.getByBooking);
router.get('/variance/:bookingId', bookingJobCostController.getVariance);
router.post('/', authorize(['OWNER', 'MANAGER', 'MECHANIC']), bookingJobCostController.create);
router.get('/:id', bookingJobCostController.getById);
router.put('/:id', authorize(['OWNER', 'MANAGER', 'MECHANIC']), bookingJobCostController.update);
router.delete('/:id', authorize(['OWNER', 'MANAGER']), bookingJobCostController.delete);

export default router;
