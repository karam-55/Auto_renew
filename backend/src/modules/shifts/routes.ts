import { Router } from 'express';
import { ShiftController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();
const shiftController = new ShiftController();

// All routes require authentication
router.use(authenticate);

// Get all shifts (accessible by OWNER, MANAGER, HR_MANAGER)
router.get('/', authorize(['OWNER', 'MANAGER', 'HR_MANAGER']), shiftController.getAllShifts);

// Search shifts (accessible by OWNER, MANAGER, HR_MANAGER)
router.get('/search', authorize(['OWNER', 'MANAGER', 'HR_MANAGER']), shiftController.searchShifts);

// Get shift by ID (accessible by OWNER, MANAGER, HR_MANAGER)
router.get('/:id', authorize(['OWNER', 'MANAGER', 'HR_MANAGER']), tenantGuard('Shift'), shiftController.getShiftById);

// Create shift (accessible by OWNER, MANAGER, HR_MANAGER)
router.post('/', authorize(['OWNER', 'MANAGER', 'HR_MANAGER']), shiftController.createShift);

// Update shift (accessible by OWNER, MANAGER, HR_MANAGER)
router.put('/:id', authorize(['OWNER', 'MANAGER', 'HR_MANAGER']), tenantGuard('Shift'), shiftController.updateShift);

// Delete shift (accessible by OWNER, MANAGER)
router.delete('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('Shift'), shiftController.deleteShift);

export default router;
