import { Router } from 'express';
import { InventoryCountController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Initialize controller with io (will be set after server starts)
let inventoryCountControllerInstance: InventoryCountController;

export const initInventoryCountRoutes = (io: any) => {
  inventoryCountControllerInstance = new InventoryCountController();
};

// Helper to get controller
const getController = () => {
  if (!inventoryCountControllerInstance) {
    inventoryCountControllerInstance = new InventoryCountController();
  }
  return inventoryCountControllerInstance;
};

// ============================================
// INVENTORY COUNTS
// ============================================

router.post('/', authorize(['OWNER', 'MANAGER']), (req, res) => getController().createCount(req, res));
router.get('/', (req, res) => getController().getCounts(req, res));
router.get('/:id', tenantGuard('InventoryCount'), (req, res) => getController().getCountById(req, res));
router.put('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('InventoryCount'), (req, res) => getController().updateCount(req, res));
router.post('/:id/approve', authorize(['OWNER', 'MANAGER']), tenantGuard('InventoryCount'), (req, res) => getController().approveCount(req, res));
router.delete('/:id', authorize(['OWNER']), tenantGuard('InventoryCount'), (req, res) => getController().deleteCount(req, res));

// ============================================
// INVENTORY COUNT ITEMS
// ============================================

router.post('/:id/items', authorize(['OWNER', 'MANAGER']), tenantGuard('InventoryCount'), (req, res) => getController().addItem(req, res));
router.put('/:id/items/:itemId', authorize(['OWNER', 'MANAGER']), tenantGuard('InventoryCount'), (req, res) => getController().updateItem(req, res));
router.delete('/:id/items/:itemId', authorize(['OWNER', 'MANAGER']), tenantGuard('InventoryCount'), (req, res) => getController().deleteItem(req, res));

export default router;
