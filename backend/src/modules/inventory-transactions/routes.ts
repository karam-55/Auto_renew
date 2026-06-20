import { Router } from 'express';
import { InventoryTransactionController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { auditContextMiddleware } from '../../middleware/audit.middleware';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();
const inventoryTransactionController = new InventoryTransactionController();

// All routes require authentication
router.use(authenticate);

// Add audit context middleware after authentication
router.use(auditContextMiddleware);

// Create inventory transaction (accessible by OWNER, MANAGER, RECEPTIONIST, SALES)
router.post(
  '/',
  authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES']),
  inventoryTransactionController.createInventoryTransaction
);

// List inventory transactions with pagination (accessible by OWNER, MANAGER, RECEPTIONIST, SALES, MECHANIC)
router.get(
  '/',
  authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES', 'MECHANIC']),
  inventoryTransactionController.getInventoryTransactions
);

// Get inventory transaction by ID (accessible by OWNER, MANAGER, RECEPTIONIST, SALES, MECHANIC)
router.get(
  '/:id',
  authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES', 'MECHANIC']),
  tenantGuard('InventoryTransaction'),
  inventoryTransactionController.getInventoryTransactionById
);

// Update inventory transaction (accessible by OWNER, MANAGER, RECEPTIONIST, SALES)
router.put(
  '/:id',
  authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES']),
  tenantGuard('InventoryTransaction'),
  inventoryTransactionController.updateInventoryTransaction
);

// Delete inventory transaction (accessible by OWNER, MANAGER)
router.delete(
  '/:id',
  authorize(['OWNER', 'MANAGER']),
  tenantGuard('InventoryTransaction'),
  inventoryTransactionController.deleteInventoryTransaction
);

// Get part history (accessible by OWNER, MANAGER, RECEPTIONIST, SALES, MECHANIC)
router.get(
  '/part/:partId',
  authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES', 'MECHANIC']),
  inventoryTransactionController.getPartHistory
);

// Get warehouse transactions (accessible by OWNER, MANAGER, RECEPTIONIST, SALES, MECHANIC)
router.get(
  '/warehouse/:warehouseId',
  authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES', 'MECHANIC']),
  inventoryTransactionController.getWarehouseTransactions
);

// Consume parts for booking (accessible by OWNER, MANAGER, RECEPTIONIST, MECHANIC)
router.post(
  '/consume',
  authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'MECHANIC']),
  inventoryTransactionController.consumeParts
);

export default router;
