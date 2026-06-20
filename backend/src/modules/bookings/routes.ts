import { Router } from 'express';
import { BookingController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { AuthRequest } from '../../shared/middlewares/auth';
import { auditContextMiddleware } from '../../middleware/audit.middleware';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();
const bookingController = new BookingController();

// All routes require authentication
router.use(authenticate);

// Add audit context middleware after authentication
router.use(auditContextMiddleware);

// Initialize controller with io (will be set after server starts)
let bookingControllerInstance: BookingController;

export const initBookingsRoutes = (io: any) => {
  bookingControllerInstance = new BookingController(io);
};

// Helper to get controller
const getController = () => {
  if (!bookingControllerInstance) {
    bookingControllerInstance = new BookingController();
  }
  return bookingControllerInstance;
};

// Get all bookings (accessible by all authenticated users)
router.get('/', (req, res, next) => {
  getController().getAllBookings(req, res);
});

// Get bookings by date (accessible by all authenticated users)
router.get('/by-date', (req, res, next) => {
  getController().getBookingsByDate(req, res);
});

// Get dashboard stats (accessible by OWNER, MANAGER, RECEPTIONIST)
router.get('/dashboard-stats', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST']), (req, res, next) => {
  getController().getDashboardStats(req, res);
});

// Get bookings by mechanic (accessible by OWNER, MANAGER, and the mechanic themselves)
router.get('/mechanic/:mechanicId', (req: AuthRequest, res, next) => {
  // Allow mechanics to see their own bookings
  if (req.user?.role === 'MECHANIC' && req.params.mechanicId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  getController().getBookingsByMechanic(req, res);
});

// Get booking by ID (accessible by all authenticated users)
router.get('/:id', tenantGuard('Booking'), (req, res, next) => {
  getController().getBookingById(req, res);
});

// Create booking (accessible by OWNER, MANAGER, RECEPTIONIST)
router.post('/', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST']), (req, res, next) => {
  getController().createBooking(req, res);
});

// Update booking (accessible by OWNER, MANAGER, RECEPTIONIST, MECHANIC)
router.put('/:id', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'MECHANIC']), tenantGuard('Booking'), (req, res, next) => {
  getController().updateBooking(req, res);
});

// Delete booking (accessible by OWNER, MANAGER)
router.delete('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('Booking'), (req, res, next) => {
  getController().deleteBooking(req, res);
});

// Add service to booking (accessible by OWNER, MANAGER, RECEPTIONIST)
router.post('/:id/services', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST']), tenantGuard('Booking'), (req, res, next) => {
  getController().addServiceToBooking(req, res);
});

// Remove service from booking (accessible by OWNER, MANAGER, RECEPTIONIST)
router.delete('/:id/services/:serviceId', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST']), tenantGuard('Booking'), (req, res, next) => {
  getController().removeServiceFromBooking(req, res);
});

export default router;
