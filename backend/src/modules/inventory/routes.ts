import { Router } from 'express';
import { InventoryController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';

const router = Router();
const inventoryController = new InventoryController();

// All routes require authentication
router.use(authenticate);

// GET /api/inventory - List inventory items
router.get('/', authorize(['OWNER', 'MANAGER']), inventoryController.getInventoryOverview);

// Get inventory overview (accessible by OWNER, MANAGER)
router.get('/overview', authorize(['OWNER', 'MANAGER']), inventoryController.getInventoryOverview);

// Get low stock alerts (accessible by OWNER, MANAGER)
router.get('/low-stock', authorize(['OWNER', 'MANAGER']), inventoryController.getLowStockAlerts);

// Get stock by warehouse (accessible by OWNER, MANAGER)
router.get('/stock-by-warehouse', authorize(['OWNER', 'MANAGER']), inventoryController.getStockByWarehouse);

export default router;
