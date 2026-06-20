import { Request, Response } from 'express';
import { ErrorMiddleware } from '../../middlewares/error.middleware';
import { WorkOrderRepository } from '../../../infrastructure/repositories/bookings/WorkOrderRepository';

export class WorkOrderController {
  private workOrderRepository: WorkOrderRepository;

  constructor() {
    this.workOrderRepository = new WorkOrderRepository();
  }

  async createForBooking(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      const workOrder = await this.workOrderRepository.createForBooking(bookingId);

      ErrorMiddleware.success(res, workOrder, 201);
    } catch (error) {
      ErrorMiddleware.error(res, 'CREATE_ERROR', 'Failed to create work order', 500);
    }
  }
}
