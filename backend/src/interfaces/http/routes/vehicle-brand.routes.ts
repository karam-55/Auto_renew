import { Router } from 'express';
import { VehicleBrandController } from '../controllers/vehicle-brand.controller';

const router = Router();
const controller = new VehicleBrandController();

router.get('/', controller.list.bind(controller));
router.get('/:id', controller.getById.bind(controller));

export default router;
