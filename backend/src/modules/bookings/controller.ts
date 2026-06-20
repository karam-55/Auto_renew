import { Request, Response } from 'express';
import { BookingService } from './service';
import { AuthRequest } from '../../shared/middlewares/auth';
import { logAuditFromRequest } from '../../middleware/audit.middleware';
import { Logger } from '../../infrastructure/logging/logger';

export class BookingController {
  private bookingService: BookingService;

  constructor(io?: any) {
    this.bookingService = new BookingService(io);
  }

  setIo(io: any) {
    this.bookingService = new BookingService(io);
  }

  getAllBookings = async (req: AuthRequest, res: Response) => {
    try {
      const filters: any = {};
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.customerId) filters.customerId = req.query.customerId as string;
      if (req.query.vehicleId) filters.vehicleId = req.query.vehicleId as string;
      if (req.query.dateFrom) filters.dateFrom = new Date(req.query.dateFrom as string);
      if (req.query.dateTo) filters.dateTo = new Date(req.query.dateTo as string);
      if (req.query.page) filters.page = parseInt(req.query.page as string);
      if (req.query.pageSize) filters.limit = parseInt(req.query.pageSize as string);

      const bookings = await this.bookingService.getAllBookings(req.user!.tenantId, filters);
      
      // Get total count for pagination
      const total = await this.bookingService.getBookingsCount(req.user!.tenantId, filters);
      
      res.json({ 
        success: true,
        data: bookings,
        meta: {
          total,
          page: filters.page || 1,
          pageSize: filters.limit || 20,
        },
      });
    } catch (error) {
      Logger.error('Get all bookings error', error);
      res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
    }
  };

  getBookingById = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const booking = await this.bookingService.getBookingById(req.user!.tenantId, id);

      if (!booking) {
        return res.status(404).json({ success: false, error: 'Booking not found' });
      }

      res.json({ success: true, data: booking });
    } catch (error) {
      Logger.error('Get booking error', error);
      res.status(500).json({ success: false, error: 'Failed to fetch booking' });
    }
  };

  getBookingsByDate = async (req: AuthRequest, res: Response) => {
    try {
      const { date } = req.query;
      if (!date || typeof date !== 'string') {
        return res.status(400).json({ success: false, error: 'Date parameter required' });
      }

      const bookings = await this.bookingService.getBookingsByDate(req.user!.tenantId, new Date(date));
      res.json({ success: true, data: bookings });
    } catch (error) {
      Logger.error('Get bookings by date error', error);
      res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
    }
  };

  getBookingsByMechanic = async (req: AuthRequest, res: Response) => {
    try {
      const { mechanicId } = req.params;
      const bookings = await this.bookingService.getBookingsByMechanic(req.user!.tenantId, mechanicId);
      res.json({ success: true, data: bookings });
    } catch (error) {
      Logger.error('Get bookings by mechanic error', error);
      res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
    }
  };

  getDashboardStats = async (req: AuthRequest, res: Response) => {
    try {
      const stats = await this.bookingService.getDashboardStats(req.user!.tenantId);
      res.json({ success: true, data: stats });
    } catch (error) {
      Logger.error('Get dashboard stats error', error);
      res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats' });
    }
  };

  createBooking = async (req: AuthRequest, res: Response) => {
    try {
      const booking = await this.bookingService.createBooking(req.user!.tenantId, req.body, req.user!.id);
      
      // Log booking creation
      logAuditFromRequest(req, 'BOOKING_CREATED', 'Booking', booking.id, null, booking);
      
      res.status(201).json({ success: true, data: booking });
    } catch (error: any) {
      Logger.error('Create booking error', error);
      res.status(400).json({ success: false, error: error.message || 'Failed to create booking' });
    }
  };

  updateBooking = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const oldBooking = await this.bookingService.getBookingById(req.user!.tenantId, id);
      const booking = await this.bookingService.updateBooking(req.user!.tenantId, id, req.body);
      
      // Log booking update
      logAuditFromRequest(req, 'BOOKING_UPDATED', 'Booking', id, oldBooking, booking);
      
      res.json({ success: true, data: booking });
    } catch (error: any) {
      Logger.error('Update booking error', error);
      res.status(400).json({ success: false, error: error.message || 'Failed to update booking' });
    }
  };

  deleteBooking = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const oldBooking = await this.bookingService.getBookingById(req.user!.tenantId, id);
      await this.bookingService.deleteBooking(req.user!.tenantId, id);

      // Log booking deletion
      logAuditFromRequest(req, 'BOOKING_DELETED', 'Booking', id, oldBooking, null);

      res.status(200).json({ success: true });
    } catch (error: any) {
      Logger.error('Delete booking error', error);
      res.status(400).json({ success: false, error: error.message || 'Failed to delete booking' });
    }
  };

  addServiceToBooking = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { serviceId } = req.body;

      if (!serviceId) {
        return res.status(400).json({ success: false, error: 'Service ID is required' });
      }

      const booking = await this.bookingService.addServiceToBooking(req.user!.tenantId, id, serviceId);

      // Log service addition
      logAuditFromRequest(req, 'BOOKING_SERVICE_ADDED', 'Booking', id, null, booking);

      res.json({ success: true, data: booking });
    } catch (error: any) {
      Logger.error('Add service to booking error', error);
      res.status(400).json({ success: false, error: error.message || 'Failed to add service to booking' });
    }
  };

  removeServiceFromBooking = async (req: AuthRequest, res: Response) => {
    try {
      const { id, serviceId } = req.params;

      const booking = await this.bookingService.removeServiceFromBooking(req.user!.tenantId, id, serviceId);

      // Log service removal
      logAuditFromRequest(req, 'BOOKING_SERVICE_REMOVED', 'Booking', id, null, booking);

      res.json({ success: true, data: booking });
    } catch (error: any) {
      Logger.error('Remove service from booking error', error);
      res.status(400).json({ success: false, error: error.message || 'Failed to remove service from booking' });
    }
  };
}
