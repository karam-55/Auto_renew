import { Request, Response } from 'express';
import { ErrorMiddleware } from '../../middlewares/error.middleware';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { BookingRepository } from '../../../infrastructure/repositories/bookings/BookingRepository';

export class BookingController {
  private bookingRepository: BookingRepository;

  constructor() {
    this.bookingRepository = new BookingRepository();
  }

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { customerId, vehicleId, scheduledDate, scheduledTime, notes, priority } = req.body;
      const tenantId = req.user?.tenantId || 'default';

      const booking = await this.bookingRepository.save({
        id: crypto.randomUUID(),
        tenantId,
        customerId,
        vehicleId,
        status: 'PENDING',
        publicToken: crypto.randomUUID(),
        scheduledDate,
        scheduledTime,
        notes,
        priority: priority || 'NORMAL',
      });

      ErrorMiddleware.success(res, booking, 201);
    } catch (error) {
      ErrorMiddleware.error(res, 'CREATE_ERROR', 'Failed to create booking', 500);
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const booking = await this.bookingRepository.findById(id);

      if (!booking) {
        ErrorMiddleware.error(res, 'NOT_FOUND', 'Booking not found', 404);
        return;
      }

      ErrorMiddleware.success(res, booking, 200);
    } catch (error) {
      ErrorMiddleware.error(res, 'FETCH_ERROR', 'Failed to fetch booking', 500);
    }
  }

  async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || 'default';
      const bookings = await this.bookingRepository.list(tenantId);

      ErrorMiddleware.success(res, bookings, 200);
    } catch (error) {
      ErrorMiddleware.error(res, 'FETCH_ERROR', 'Failed to list bookings', 500);
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, notes, estimatedCompletionDate, actualCompletionDate, priority } = req.body;

      const booking = await this.bookingRepository.update({
        id,
        status,
        notes,
        estimatedCompletionDate,
        actualCompletionDate,
        priority,
      });

      ErrorMiddleware.success(res, booking, 200);
    } catch (error) {
      ErrorMiddleware.error(res, 'UPDATE_ERROR', 'Failed to update booking', 500);
    }
  }

  async findByVehicle(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const booking = await this.bookingRepository.findOpenByVehicleId(vehicleId);

      ErrorMiddleware.success(res, booking, 200);
    } catch (error) {
      ErrorMiddleware.error(res, 'FETCH_ERROR', 'Failed to find booking by vehicle', 500);
    }
  }
}
