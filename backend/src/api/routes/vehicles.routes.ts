import { Router } from 'express';
import { VehicleController } from '../controllers/vehicles/vehicle.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const vehicleController = new VehicleController();

router.post('/', AuthMiddleware.authenticate, vehicleController.create.bind(vehicleController));
router.get('/:id', vehicleController.findById.bind(vehicleController));
router.get('/', AuthMiddleware.authenticate, vehicleController.list.bind(vehicleController));
router.get('/customer/:customerId', vehicleController.listByCustomer.bind(vehicleController));
router.put('/:id', vehicleController.update.bind(vehicleController));

export default router;
