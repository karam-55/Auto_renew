import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth';
import workOrderController from './controller';

const router = Router();

router.use(authenticate);

// GET /api/work-orders - List all work orders
router.get('/', workOrderController.getAllWorkOrders);

// GET /api/work-orders/stats - Get work order statistics
router.get('/stats', workOrderController.getWorkOrderStats);

// GET /api/work-orders/:id - Get work order by ID
router.get('/:id', workOrderController.getWorkOrderById);

// POST /api/work-orders - Create work order
router.post('/', workOrderController.createWorkOrder);

// PUT /api/work-orders/:id - Update work order
router.put('/:id', workOrderController.updateWorkOrder);

// DELETE /api/work-orders/:id - Delete work order
router.delete('/:id', workOrderController.deleteWorkOrder);

export default router;
