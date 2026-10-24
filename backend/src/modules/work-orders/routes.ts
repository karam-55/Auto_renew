import { Router } from 'express';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import workOrderController from './controller';

const router = Router();

router.use(authenticate);

// GET /api/work-orders - List all work orders
router.get('/', workOrderController.getAllWorkOrders);

// GET /api/work-orders/stats - Get work order statistics
router.get('/stats', workOrderController.getWorkOrderStats);

// Resolve the one-to-one work order for a booking.
router.get('/booking/:bookingId', workOrderController.getWorkOrderByBooking);

// GET /api/work-orders/:id - Get work order by ID
router.get('/:id', workOrderController.getWorkOrderById);

// POST /api/work-orders - Create work order (RECEPTIONIST is view-only on work orders)
router.post('/', authorize(['OWNER', 'MANAGER']), workOrderController.createWorkOrder);

// PUT /api/work-orders/:id - Update work order
router.put('/:id', authorize(['OWNER', 'MANAGER', 'MECHANIC']), workOrderController.updateWorkOrder);

router.put('/:id/services/:bookingServiceId/price', authorize(['OWNER', 'MANAGER', 'ACCOUNTANT']), workOrderController.setServicePrice);

router.post('/:id/materials', authorize(['OWNER', 'MANAGER', 'MECHANIC']), workOrderController.addInventoryMaterial);

router.post('/:id/complete', authorize(['OWNER', 'MANAGER', 'ACCOUNTANT']), workOrderController.completeWorkOrder);

// DELETE /api/work-orders/:id - Delete work order
router.delete('/:id', authorize(['OWNER', 'MANAGER']), workOrderController.deleteWorkOrder);

export default router;
