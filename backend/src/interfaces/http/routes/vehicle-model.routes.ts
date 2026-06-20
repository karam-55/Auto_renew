import { Router } from 'express';
import { VehicleModelController } from '../controllers/vehicle-model.controller';

const router = Router();
const controller = new VehicleModelController();

router.get('/', controller.list.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.get('/brand/:brandId', controller.listByBrand.bind(controller));

export default router;
