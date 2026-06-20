import { Router } from 'express';
import { CustomerVehicleController } from '../controllers/customer-vehicle.controller';

const router = Router();
const controller = new CustomerVehicleController();

router.post('/', controller.add.bind(controller));
router.put('/:id', controller.update.bind(controller));
router.delete('/:id', controller.delete.bind(controller));

export default router;
