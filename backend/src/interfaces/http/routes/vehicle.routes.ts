import { Router } from 'express';
import { Logger } from '../../../infrastructure/logging/logger';
import { VehicleController } from '../controllers/vehicle.controller';

const router = Router();
const controller = new VehicleController();

router.post('/', controller.create.bind(controller));
router.get('/', controller.list.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.put('/:id', (req, res, next) => {
  Logger.debug('=== INTERFACES HTTP VEHICLE UPDATE ROUTE CALLED ===');
  Logger.debug('Vehicle update route', { vehicleId: req.params.id, body: req.body });
  next();
}, controller.update.bind(controller));
router.delete('/:id', controller.delete.bind(controller));
router.post('/:id/assign-customer', controller.assignCustomer.bind(controller));

export default router;
