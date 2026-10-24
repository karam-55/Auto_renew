import { Router } from 'express';
import { ScheduleController } from './schedule.controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();
const scheduleController = new ScheduleController();

// All routes require authentication
router.use(authenticate);

// Schedule reads: OWNER, MANAGER, RECEPTIONIST (front desk sees who is working)
const canViewSchedule = authorize(['OWNER', 'MANAGER', 'RECEPTIONIST']);
// Schedule mutations: OWNER, MANAGER only (reception is read-only)
const canManageSchedule = authorize(['OWNER', 'MANAGER']);

// GET /api/schedule?date=&technicianId=
router.get('/', canViewSchedule, scheduleController.getSchedule);

// GET /api/schedule/:id
router.get('/:id', canViewSchedule, tenantGuard('Schedule'), scheduleController.getScheduleById);

// POST /api/schedule
router.post('/', canManageSchedule, scheduleController.createSchedule);

// PUT /api/schedule/:id
router.put('/:id', canManageSchedule, tenantGuard('Schedule'), scheduleController.updateSchedule);

// POST /api/schedule/:id/start
router.post('/:id/start', canManageSchedule, tenantGuard('Schedule'), scheduleController.startTask);

// POST /api/schedule/:id/complete
router.post('/:id/complete', canManageSchedule, tenantGuard('Schedule'), scheduleController.completeTask);

// POST /api/schedule/:id/cancel
router.post('/:id/cancel', canManageSchedule, tenantGuard('Schedule'), scheduleController.cancelTask);

// POST /api/schedule/booking
router.post('/booking', canManageSchedule, scheduleController.createScheduleForBooking);

export default router;
