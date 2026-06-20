import { Router } from 'express';
import { MechanicAssignmentController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all mechanic assignments (accessible by OWNER, MANAGER)
router.get('/', authorize(['OWNER', 'MANAGER']), (req, res) => {
  const controller = new MechanicAssignmentController(req.app.get('io'));
  controller.getAllMechanicAssignments(req, res);
});

// Get assignments by mechanic (accessible by OWNER, MANAGER, and the mechanic themselves)
router.get('/mechanic/:mechanicId', (req, res) => {
  const controller = new MechanicAssignmentController(req.app.get('io'));
  controller.getAssignmentsByMechanic(req, res);
});

// Get assignments by booking (accessible by OWNER, MANAGER, RECEPTIONIST)
router.get('/booking/:bookingId', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST']), (req, res) => {
  const controller = new MechanicAssignmentController(req.app.get('io'));
  controller.getAssignmentsByBooking(req, res);
});

// Get assignment by ID (accessible by OWNER, MANAGER)
router.get('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('MechanicAssignment'), (req, res) => {
  const controller = new MechanicAssignmentController(req.app.get('io'));
  controller.getMechanicAssignmentById(req, res);
});

// Create mechanic assignment (accessible by OWNER, MANAGER)
router.post('/', authorize(['OWNER', 'MANAGER']), (req, res) => {
  const controller = new MechanicAssignmentController(req.app.get('io'));
  controller.createMechanicAssignment(req, res);
});

// Update mechanic assignment (accessible by OWNER, MANAGER)
router.put('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('MechanicAssignment'), (req, res) => {
  const controller = new MechanicAssignmentController(req.app.get('io'));
  controller.updateMechanicAssignment(req, res);
});

// Delete mechanic assignment (accessible by OWNER, MANAGER)
router.delete('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('MechanicAssignment'), (req, res) => {
  const controller = new MechanicAssignmentController(req.app.get('io'));
  controller.deleteMechanicAssignment(req, res);
});

export default router;
