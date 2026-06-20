import { Router } from 'express';
import { AttendanceController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();
const attendanceController = new AttendanceController();

// All routes require authentication
router.use(authenticate);

// Get all attendance (accessible by OWNER, MANAGER, HR_MANAGER)
router.get('/', attendanceController.getAllAttendance);

// Get attendance by date (accessible by OWNER, MANAGER, HR_MANAGER)
router.get('/by-date', attendanceController.getAttendanceByDate);

// Get attendance by employee (accessible by OWNER, MANAGER, HR_MANAGER)
router.get('/employee/:employeeId', attendanceController.getAttendanceByEmployee);

// Get attendance by ID (accessible by OWNER, MANAGER, HR_MANAGER)
router.get('/:id', tenantGuard('Attendance'), attendanceController.getAttendanceById);

// Create attendance (accessible by OWNER, MANAGER, HR_MANAGER)
router.post('/', authorize(['OWNER', 'MANAGER', 'HR_MANAGER']), attendanceController.createAttendance);

// Check in (accessible by OWNER, MANAGER, HR_MANAGER)
router.post('/check-in/:employeeId', authorize(['OWNER', 'MANAGER', 'HR_MANAGER']), tenantGuard('Employee'), attendanceController.checkIn);

// Check out (accessible by OWNER, MANAGER, HR_MANAGER)
router.post('/check-out/:id', authorize(['OWNER', 'MANAGER', 'HR_MANAGER']), tenantGuard('Attendance'), attendanceController.checkOut);

// Update attendance (accessible by OWNER, MANAGER, HR_MANAGER)
router.put('/:id', authorize(['OWNER', 'MANAGER', 'HR_MANAGER']), tenantGuard('Attendance'), attendanceController.updateAttendance);

// Delete attendance (accessible by OWNER, MANAGER)
router.delete('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('Attendance'), attendanceController.deleteAttendance);

export default router;
