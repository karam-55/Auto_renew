import { Router } from 'express';
import { PurchaseOrderController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();
const purchaseOrderController = new PurchaseOrderController();

// All routes require authentication
router.use(authenticate);

// Create purchase order (accessible by OWNER, MANAGER, SALES)
router.post('/', authorize(['OWNER', 'MANAGER', 'SALES']), purchaseOrderController.createPurchaseOrder);

// List purchase orders with pagination (accessible by OWNER, MANAGER, SALES)
router.get('/', authorize(['OWNER', 'MANAGER', 'SALES']), purchaseOrderController.getPurchaseOrders);

// Get purchase order by ID (accessible by OWNER, MANAGER, SALES)
router.get('/:id', authorize(['OWNER', 'MANAGER', 'SALES']), tenantGuard('PurchaseOrder'), purchaseOrderController.getPurchaseOrderById);

// Update purchase order (accessible by OWNER, MANAGER, SALES)
router.put('/:id', authorize(['OWNER', 'MANAGER', 'SALES']), tenantGuard('PurchaseOrder'), purchaseOrderController.updatePurchaseOrder);

// Delete purchase order (accessible by OWNER, MANAGER)
router.delete('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('PurchaseOrder'), purchaseOrderController.deletePurchaseOrder);

// Add line item to purchase order (accessible by OWNER, MANAGER, SALES)
router.post('/:id/lines', authorize(['OWNER', 'MANAGER', 'SALES']), tenantGuard('PurchaseOrder'), purchaseOrderController.addPurchaseOrderLine);

// Update line item (accessible by OWNER, MANAGER, SALES)
router.put('/:id/lines/:lineId', authorize(['OWNER', 'MANAGER', 'SALES']), tenantGuard('PurchaseOrder'), purchaseOrderController.updatePurchaseOrderLine);

// Remove line item (accessible by OWNER, MANAGER, SALES)
router.delete('/:id/lines/:lineId', authorize(['OWNER', 'MANAGER', 'SALES']), tenantGuard('PurchaseOrder'), purchaseOrderController.removePurchaseOrderLine);

// Approve purchase order (accessible by OWNER, MANAGER)
router.post('/:id/approve', authorize(['OWNER', 'MANAGER']), tenantGuard('PurchaseOrder'), purchaseOrderController.approvePurchaseOrder);

// Cancel purchase order (accessible by OWNER, MANAGER)
router.post('/:id/cancel', authorize(['OWNER', 'MANAGER']), tenantGuard('PurchaseOrder'), purchaseOrderController.cancelPurchaseOrder);

// Receive purchase order (accessible by OWNER, MANAGER)
router.post('/:id/receive', authorize(['OWNER', 'MANAGER']), tenantGuard('PurchaseOrder'), purchaseOrderController.receivePurchaseOrder);

export default router;
