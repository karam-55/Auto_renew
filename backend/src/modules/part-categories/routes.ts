import { Router } from 'express';
import { PartCategoryController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();
const partCategoryController = new PartCategoryController();

// All routes require authentication
router.use(authenticate);

// Create category (accessible by OWNER, MANAGER, RECEPTIONIST, SALES)
router.post('/', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES']), partCategoryController.createPartCategory);

// List categories (accessible by OWNER, MANAGER, RECEPTIONIST, SALES, MECHANIC)
router.get('/', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES', 'MECHANIC']), partCategoryController.getPartCategories);

// Get category tree (accessible by OWNER, MANAGER, RECEPTIONIST, SALES, MECHANIC)
router.get('/tree', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES', 'MECHANIC']), partCategoryController.getCategoryTree);

// Get category by ID (accessible by OWNER, MANAGER, RECEPTIONIST, SALES, MECHANIC)
router.get('/:id', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES', 'MECHANIC']), tenantGuard('PartCategory'), partCategoryController.getPartCategoryById);

// Update category (accessible by OWNER, MANAGER, RECEPTIONIST, SALES)
router.put('/:id', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES']), tenantGuard('PartCategory'), partCategoryController.updatePartCategory);

// Delete category (accessible by OWNER, MANAGER)
router.delete('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('PartCategory'), partCategoryController.deletePartCategory);

export default router;
