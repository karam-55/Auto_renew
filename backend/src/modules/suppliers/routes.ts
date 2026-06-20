import { Router } from 'express';
import { SupplierController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();
const supplierController = new SupplierController();

// All routes require authentication
router.use(authenticate);

// Create supplier (accessible by OWNER, MANAGER, SALES)
router.post('/', authorize(['OWNER', 'MANAGER', 'SALES']), supplierController.createSupplier);

// List suppliers with pagination (accessible by OWNER, MANAGER, SALES)
router.get('/', authorize(['OWNER', 'MANAGER', 'SALES']), supplierController.getSuppliers);

// Search suppliers (accessible by OWNER, MANAGER, SALES)
router.get('/search/:query', authorize(['OWNER', 'MANAGER', 'SALES']), supplierController.searchSuppliers);

// Get supplier by ID (accessible by OWNER, MANAGER, SALES)
router.get('/:id', authorize(['OWNER', 'MANAGER', 'SALES']), tenantGuard('Supplier'), supplierController.getSupplierById);

// Update supplier (accessible by OWNER, MANAGER, SALES)
router.put('/:id', authorize(['OWNER', 'MANAGER', 'SALES']), tenantGuard('Supplier'), supplierController.updateSupplier);

// Delete supplier (accessible by OWNER, MANAGER)
router.delete('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('Supplier'), supplierController.deleteSupplier);

export default router;
