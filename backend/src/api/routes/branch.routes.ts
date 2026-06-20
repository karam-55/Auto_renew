import { Router } from 'express';
import { BranchesController } from '../controllers/branch/branches.controller';
import { WarehousesController } from '../controllers/branch/warehouses.controller';
import { InventoryTransferController } from '../controllers/branch/inventory-transfer.controller';
import { ConsolidatedReportsController } from '../controllers/branch/consolidated-reports.controller';
import { branchIsolationMiddleware, requireAdminAccess } from '../../middleware/branch-isolation.middleware';

const router = Router();
const branchesController = new BranchesController();
const warehousesController = new WarehousesController();
const inventoryTransferController = new InventoryTransferController();
const consolidatedReportsController = new ConsolidatedReportsController();

// Apply branch isolation middleware to all routes
router.use(branchIsolationMiddleware);

// Branch routes
router.get('/branches', (req, res) => branchesController.getAllBranches(req, res));
router.get('/branches/:id', (req, res) => branchesController.getBranchById(req, res));
router.post('/branches', requireAdminAccess, (req, res) => branchesController.createBranch(req, res));
router.post('/branches/batch', requireAdminAccess, (req, res) => branchesController.createMany(req, res));
router.put('/branches/:id', requireAdminAccess, (req, res) => branchesController.updateBranch(req, res));
router.delete('/branches/:id', requireAdminAccess, (req, res) => branchesController.deleteBranch(req, res));
router.post('/branches/:id/activate', requireAdminAccess, (req, res) => branchesController.activateBranch(req, res));
router.post('/branches/:id/deactivate', requireAdminAccess, (req, res) => branchesController.deactivateBranch(req, res));

// Warehouse routes
router.get('/branches/:branchId/warehouses', (req, res) => warehousesController.getAllWarehouses(req, res));
router.get('/warehouses', (req, res) => warehousesController.getAllWarehouses(req, res));
router.get('/warehouses/:id', (req, res) => warehousesController.getWarehouseById(req, res));
router.post('/warehouses', (req, res) => warehousesController.createWarehouse(req, res));
router.put('/warehouses/:id', (req, res) => warehousesController.updateWarehouse(req, res));
router.delete('/warehouses/:id', (req, res) => warehousesController.deleteWarehouse(req, res));
router.get('/warehouses/:id/stock', (req, res) => warehousesController.getWarehouseStock(req, res));
router.post('/warehouses/:id/set-primary', (req, res) => warehousesController.setPrimaryWarehouse(req, res));

// Inventory Transfer routes
router.post('/inventory/transfer', (req, res) => inventoryTransferController.createTransfer(req, res));
router.get('/inventory/transfer/:id', (req, res) => inventoryTransferController.getTransferById(req, res));
router.get('/inventory/transfer', (req, res) => inventoryTransferController.getAllTransfers(req, res));
router.post('/inventory/transfer/:id/approve', (req, res) => inventoryTransferController.approveTransfer(req, res));
router.post('/inventory/transfer/:id/ship', (req, res) => inventoryTransferController.shipTransfer(req, res));
router.post('/inventory/transfer/:id/receive', (req, res) => inventoryTransferController.receiveTransfer(req, res));
router.post('/inventory/transfer/:id/cancel', (req, res) => inventoryTransferController.cancelTransfer(req, res));

// Consolidated Reports routes (admin only)
router.get('/reports/consolidated/sales', requireAdminAccess, (req, res) => consolidatedReportsController.getConsolidatedSales(req, res));
router.get('/reports/consolidated/profitability', requireAdminAccess, (req, res) => consolidatedReportsController.getConsolidatedProfitability(req, res));
router.get('/reports/consolidated/inventory', requireAdminAccess, (req, res) => consolidatedReportsController.getConsolidatedInventory(req, res));
router.get('/reports/consolidated/memberships', requireAdminAccess, (req, res) => consolidatedReportsController.getConsolidatedMemberships(req, res));

export default router;
