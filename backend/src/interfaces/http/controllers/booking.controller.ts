import { Request, Response } from 'express';
import { Logger } from '../../../infrastructure/logging/logger';
import { CreateBooking } from '../../../application/bookings/use-cases/CreateBooking';
import { UpdateBooking } from '../../../application/bookings/use-cases/UpdateBooking';
import { ChangeStatus } from '../../../application/bookings/use-cases/ChangeStatus';
import { GetBooking } from '../../../application/bookings/use-cases/GetBooking';
import { ListBookings } from '../../../application/bookings/use-cases/ListBookings';
import { PrismaBookingRepository } from '../../../infrastructure/bookings/repositories/PrismaBookingRepository';
import { BookingStatus } from '../../../domain/bookings/entities/BookingStatus';

export class BookingController {
  private createBooking: CreateBooking;
  private updateBooking: UpdateBooking;
  private changeStatus: ChangeStatus;
  private getBooking: GetBooking;
  private listBookings: ListBookings;

  constructor() {
    const bookingRepository = new PrismaBookingRepository();
    this.createBooking = new CreateBooking(bookingRepository);
    this.updateBooking = new UpdateBooking(bookingRepository);
    this.changeStatus = new ChangeStatus(bookingRepository);
    this.getBooking = new GetBooking(bookingRepository);
    this.listBookings = new ListBookings(bookingRepository);
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, customerId, vehicleId, scheduledDate, scheduledTime, notes, priority } = req.body;

      const result = await this.createBooking.execute(
        tenantId,
        customerId,
        vehicleId,
        new Date(scheduledDate),
        scheduledTime,
        notes,
        priority
      );

      res.status(201).json({
        id: result.booking.id,
        tenantId: result.booking.tenantId,
        customerId: result.booking.customerId,
        vehicleId: result.booking.vehicleId,
        status: result.booking.status.getValue(),
        publicToken: result.booking.publicToken.getValue(),
        scheduledDate: result.booking.scheduledDate,
        scheduledTime: result.booking.scheduledTime,
        notes: result.booking.notes,
        estimatedCompletionDate: result.booking.estimatedCompletionDate,
        actualCompletionDate: result.booking.actualCompletionDate,
        priority: result.booking.priority,
        createdAt: result.booking.createdAt,
        updatedAt: result.booking.updatedAt,
      });
    } catch (error) {
      Logger.error('Create booking error:', error);
      res.status(500).json({ error: 'Failed to create booking' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { scheduledDate, scheduledTime, notes, estimatedCompletionDate, priority } = req.body;

      const booking = await this.updateBooking.execute(
        id,
        scheduledDate ? new Date(scheduledDate) : undefined,
        scheduledTime,
        notes,
        estimatedCompletionDate ? new Date(estimatedCompletionDate) : undefined,
        priority
      );

      res.json({
        id: booking.id,
        tenantId: booking.tenantId,
        customerId: booking.customerId,
        vehicleId: booking.vehicleId,
        status: booking.status.getValue(),
        publicToken: booking.publicToken.getValue(),
        scheduledDate: booking.scheduledDate,
        scheduledTime: booking.scheduledTime,
        notes: booking.notes,
        estimatedCompletionDate: booking.estimatedCompletionDate,
        actualCompletionDate: booking.actualCompletionDate,
        priority: booking.priority,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      });
    } catch (error) {
      Logger.error('Update booking error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update booking';
      if (errorMessage === 'Booking not found') {
        res.status(404).json({ error: errorMessage });
        return;
      }
      res.status(500).json({ error: 'Failed to update booking' });
    }
  }

  async changeBookingStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const result = await this.changeStatus.execute(id, status as BookingStatus);

      res.json({
        id: result.booking.id,
        tenantId: result.booking.tenantId,
        customerId: result.booking.customerId,
        vehicleId: result.booking.vehicleId,
        status: result.booking.status.getValue(),
        publicToken: result.booking.publicToken.getValue(),
        scheduledDate: result.booking.scheduledDate,
        scheduledTime: result.booking.scheduledTime,
        notes: result.booking.notes,
        estimatedCompletionDate: result.booking.estimatedCompletionDate,
        actualCompletionDate: result.booking.actualCompletionDate,
        priority: result.booking.priority,
        createdAt: result.booking.createdAt,
        updatedAt: result.booking.updatedAt,
      });
    } catch (error) {
      Logger.error('Change status error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to change status';
      if (errorMessage === 'Booking not found') {
        res.status(404).json({ error: errorMessage });
        return;
      }
      if (errorMessage.includes('Cannot transition')) {
        res.status(400).json({ error: errorMessage });
        return;
      }
      res.status(500).json({ error: 'Failed to change status' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const booking = await this.getBooking.execute(id);

      res.json({
        id: booking.id,
        tenantId: booking.tenantId,
        customerId: booking.customerId,
        vehicleId: booking.vehicleId,
        status: booking.status.getValue(),
        publicToken: booking.publicToken.getValue(),
        scheduledDate: booking.scheduledDate,
        scheduledTime: booking.scheduledTime,
        notes: booking.notes,
        estimatedCompletionDate: booking.estimatedCompletionDate,
        actualCompletionDate: booking.actualCompletionDate,
        priority: booking.priority,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      });
    } catch (error) {
      Logger.error('Get booking error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get booking';
      if (errorMessage === 'Booking not found') {
        res.status(404).json({ error: errorMessage });
        return;
      }
      res.status(500).json({ error: 'Failed to get booking' });
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, customerId, vehicleId, status } = req.query;

      let bookings;
      if (customerId && typeof customerId === 'string') {
        bookings = await this.listBookings.executeByCustomer(customerId);
      } else if (vehicleId && typeof vehicleId === 'string') {
        bookings = await this.listBookings.executeByVehicle(vehicleId);
      } else if (status && tenantId && typeof tenantId === 'string') {
        bookings = await this.listBookings.executeByStatus(tenantId, status as BookingStatus);
      } else if (tenantId && typeof tenantId === 'string') {
        bookings = await this.listBookings.execute(tenantId);
      } else {
        res.status(400).json({ error: 'Tenant ID is required' });
        return;
      }

      res.json(
        bookings.map(booking => ({
          id: booking.id,
          tenantId: booking.tenantId,
          customerId: booking.customerId,
          vehicleId: booking.vehicleId,
          status: booking.status.getValue(),
          publicToken: booking.publicToken.getValue(),
          scheduledDate: booking.scheduledDate,
          scheduledTime: booking.scheduledTime,
          notes: booking.notes,
          estimatedCompletionDate: booking.estimatedCompletionDate,
          actualCompletionDate: booking.actualCompletionDate,
          priority: booking.priority,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt,
        }))
      );
    } catch (error) {
      Logger.error('List bookings error:', error);
      res.status(500).json({ error: 'Failed to list bookings' });
    }
  }
}
