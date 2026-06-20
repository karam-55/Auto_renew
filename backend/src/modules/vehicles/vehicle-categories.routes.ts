import { Router } from 'express';
import { VehicleCategoryController } from './vehicle-category.controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';

const router = Router();
const vehicleCategoryController = new VehicleCategoryController();

// All routes require authentication
router.use(authenticate);

// Get all vehicle categories
router.get('/', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST']), vehicleCategoryController.getAllCategories.bind(vehicleCategoryController));

// Get category by ID
router.get('/:id', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST']), vehicleCategoryController.getCategoryById.bind(vehicleCategoryController));

// Create category
router.post('/', authorize(['OWNER', 'MANAGER']), vehicleCategoryController.createCategory.bind(vehicleCategoryController));

// Update category
router.put('/:id', authorize(['OWNER', 'MANAGER']), vehicleCategoryController.updateCategory.bind(vehicleCategoryController));

// Delete category
router.delete('/:id', authorize(['OWNER', 'MANAGER']), vehicleCategoryController.deleteCategory.bind(vehicleCategoryController));

export default router;
