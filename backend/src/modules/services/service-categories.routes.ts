import { Router } from 'express';
import { ServiceCategoryController } from './service-category.controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';

const router = Router();
const serviceCategoryController = new ServiceCategoryController();

// All routes require authentication
router.use(authenticate);

// Get all service categories
router.get('/', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST']), serviceCategoryController.getAllCategories.bind(serviceCategoryController));

// Get category by ID
router.get('/:id', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST']), serviceCategoryController.getCategoryById.bind(serviceCategoryController));

// Create category
router.post('/', authorize(['OWNER', 'MANAGER']), serviceCategoryController.createCategory.bind(serviceCategoryController));

// Update category
router.put('/:id', authorize(['OWNER', 'MANAGER']), serviceCategoryController.updateCategory.bind(serviceCategoryController));

// Delete category
router.delete('/:id', authorize(['OWNER', 'MANAGER']), serviceCategoryController.deleteCategory.bind(serviceCategoryController));

export default router;
