import { Router } from 'express';
import { InventoryController } from '../controllers/inventory/inventory.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const inventoryController = new InventoryController();

// Supplier routes
router.post('/suppliers', AuthMiddleware.authenticate, inventoryController.createSupplier.bind(inventoryController));
router.get('/suppliers', AuthMiddleware.authenticate, inventoryController.listSuppliers.bind(inventoryController));

// Purchase Order routes
router.post('/purchase-orders', AuthMiddleware.authenticate, inventoryController.createPurchaseOrder.bind(inventoryController));
router.get('/purchase-orders', AuthMiddleware.authenticate, inventoryController.listPurchaseOrders.bind(inventoryController));

// GRN routes
router.post('/grns', AuthMiddleware.authenticate, inventoryController.createGRN.bind(inventoryController));
router.get('/grns', AuthMiddleware.authenticate, inventoryController.listGRNs.bind(inventoryController));

// Stock routes
router.get('/stock', AuthMiddleware.authenticate, inventoryController.listStockItems.bind(inventoryController));
router.get('/stock/movements', AuthMiddleware.authenticate, inventoryController.listStockMovements.bind(inventoryController));

export default router;
