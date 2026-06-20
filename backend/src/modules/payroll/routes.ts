import { Router } from 'express';
import { PayrollController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();
const payrollController = new PayrollController();

// All routes require authentication
router.use(authenticate);

// Get all payroll records (accessible by OWNER, MANAGER, HR_MANAGER, ACCOUNTANT)
router.get('/', payrollController.getAllPayrollRecords);

// Get payroll records by period (accessible by OWNER, MANAGER, HR_MANAGER, ACCOUNTANT)
router.get('/by-period', payrollController.getPayrollRecordsByPeriod);

// Get payroll records by employee (accessible by OWNER, MANAGER, HR_MANAGER, ACCOUNTANT)
router.get('/employee/:employeeId', payrollController.getPayrollRecordsByEmployee);

// Get payroll record by ID (accessible by OWNER, MANAGER, HR_MANAGER, ACCOUNTANT)
router.get('/:id', tenantGuard('PayrollRecord'), payrollController.getPayrollRecordById);

// Create payroll record (accessible by OWNER, MANAGER, HR_MANAGER)
router.post('/', authorize(['OWNER', 'MANAGER', 'HR_MANAGER']), payrollController.createPayrollRecord);

// Update payroll record (accessible by OWNER, MANAGER, HR_MANAGER)
router.put('/:id', authorize(['OWNER', 'MANAGER', 'HR_MANAGER']), tenantGuard('PayrollRecord'), payrollController.updatePayrollRecord);

// Approve payroll record (accessible by OWNER, MANAGER, HR_MANAGER)
router.post('/:id/approve', authorize(['OWNER', 'MANAGER', 'HR_MANAGER']), tenantGuard('PayrollRecord'), payrollController.approvePayrollRecord);

// Mark payroll as paid (accessible by OWNER, MANAGER, ACCOUNTANT)
router.post('/:id/mark-paid', authorize(['OWNER', 'MANAGER', 'ACCOUNTANT']), tenantGuard('PayrollRecord'), payrollController.markAsPaid);

// Delete payroll record (accessible by OWNER, MANAGER)
router.delete('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('PayrollRecord'), payrollController.deletePayrollRecord);

export default router;
