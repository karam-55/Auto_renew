import { Router } from 'express';
import { WarehouseController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();
const warehouseController = new WarehouseController();

// All routes require authentication
router.use(authenticate);

// Get all warehouses (accessible by OWNER, MANAGER, RECEPTIONIST, SALES)
router.get('/', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES']), warehouseController.getWarehouses);

// Get warehouse by ID (accessible by OWNER, MANAGER, RECEPTIONIST, SALES)
router.get('/:id', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES']), tenantGuard('Warehouse'), warehouseController.getWarehouseById);

// Get warehouse capacity (accessible by OWNER, MANAGER, RECEPTIONIST, SALES)
router.get('/:id/capacity', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES']), tenantGuard('Warehouse'), warehouseController.getWarehouseCapacity);

// Create warehouse (accessible by OWNER, MANAGER)
router.post('/', authorize(['OWNER', 'MANAGER']), warehouseController.createWarehouse);

// Update warehouse (accessible by OWNER, MANAGER)
router.put('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('Warehouse'), warehouseController.updateWarehouse);

// Delete warehouse (accessible by OWNER, MANAGER)
router.delete('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('Warehouse'), warehouseController.deleteWarehouse);

export default router;
