import { Router } from 'express';
import { ScheduleController } from './schedule.controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();
const scheduleController = new ScheduleController();

// All routes require authentication
router.use(authenticate);

// All schedule routes require OWNER, MANAGER, or RECEPTIONIST role
router.use(authorize(['OWNER', 'MANAGER', 'RECEPTIONIST']));

// GET /api/schedule?date=&technicianId=
router.get('/', scheduleController.getSchedule);

// GET /api/schedule/:id
router.get('/:id', tenantGuard('Schedule'), scheduleController.getScheduleById);

// POST /api/schedule
router.post('/', scheduleController.createSchedule);

// PUT /api/schedule/:id
router.put('/:id', tenantGuard('Schedule'), scheduleController.updateSchedule);

// POST /api/schedule/:id/start
router.post('/:id/start', tenantGuard('Schedule'), scheduleController.startTask);

// POST /api/schedule/:id/complete
router.post('/:id/complete', tenantGuard('Schedule'), scheduleController.completeTask);

// POST /api/schedule/:id/cancel
router.post('/:id/cancel', tenantGuard('Schedule'), scheduleController.cancelTask);

// POST /api/schedule/booking
router.post('/booking', scheduleController.createScheduleForBooking);

export default router;
