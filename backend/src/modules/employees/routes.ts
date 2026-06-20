import { Router } from 'express';
import { EmployeeController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();
const employeeController = new EmployeeController();

// All routes require authentication
router.use(authenticate);

// Get all employees (accessible by OWNER, MANAGER, HR_MANAGER)
router.get('/', authorize(['OWNER', 'MANAGER', 'HR_MANAGER']), employeeController.getAllEmployees);

// Search employees (accessible by OWNER, MANAGER, HR_MANAGER)
router.get('/search', authorize(['OWNER', 'MANAGER', 'HR_MANAGER']), employeeController.searchEmployees);

// Get employees by department (accessible by OWNER, MANAGER, HR_MANAGER)
router.get('/department/:departmentId', authorize(['OWNER', 'MANAGER', 'HR_MANAGER']), employeeController.getEmployeesByDepartment);

// Get employee by ID (accessible by OWNER, MANAGER, HR_MANAGER)
router.get('/:id', authorize(['OWNER', 'MANAGER', 'HR_MANAGER']), tenantGuard('Employee'), employeeController.getEmployeeById);

// Create employee (accessible by OWNER, MANAGER, HR_MANAGER)
router.post('/', authorize(['OWNER', 'MANAGER', 'HR_MANAGER']), employeeController.createEmployee);

// Update employee (accessible by OWNER, MANAGER, HR_MANAGER)
router.put('/:id', authorize(['OWNER', 'MANAGER', 'HR_MANAGER']), tenantGuard('Employee'), employeeController.updateEmployee);

// Delete employee (accessible by OWNER, MANAGER)
router.delete('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('Employee'), employeeController.deleteEmployee);

// Assign role to employee (accessible by OWNER, MANAGER)
router.put('/:id/role', authorize(['OWNER', 'MANAGER']), tenantGuard('Employee'), employeeController.assignRole);

// Bulk delete employees (accessible by OWNER, MANAGER)
router.post('/bulk-delete', authorize(['OWNER', 'MANAGER']), employeeController.bulkDeleteEmployees);

export default router;
