import { Router } from 'express';
import { DepartmentController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();
const departmentController = new DepartmentController();

// All routes require authentication
router.use(authenticate);

// Get all departments (accessible by OWNER, MANAGER, HR_MANAGER)
router.get('/', departmentController.getAllDepartments);

// Search departments (accessible by OWNER, MANAGER, HR_MANAGER)
router.get('/search', departmentController.searchDepartments);

// Get department by ID (accessible by OWNER, MANAGER, HR_MANAGER)
router.get('/:id', tenantGuard('Department'), departmentController.getDepartmentById);

// Create department (accessible by OWNER, MANAGER, HR_MANAGER)
router.post('/', authorize(['OWNER', 'MANAGER', 'HR_MANAGER']), departmentController.createDepartment);

// Update department (accessible by OWNER, MANAGER, HR_MANAGER)
router.put('/:id', authorize(['OWNER', 'MANAGER', 'HR_MANAGER']), tenantGuard('Department'), departmentController.updateDepartment);

// Delete department (accessible by OWNER, MANAGER)
router.delete('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('Department'), departmentController.deleteDepartment);

// Bulk delete departments (accessible by OWNER, MANAGER)
router.post('/bulk-delete', authorize(['OWNER', 'MANAGER']), departmentController.bulkDeleteDepartments);

export default router;
