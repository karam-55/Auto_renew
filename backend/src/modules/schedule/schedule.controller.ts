import { Request, Response } from 'express';
import { Logger } from '../../infrastructure/logging/logger';
import { ScheduleService } from './schedule.service';
import { AuthRequest } from '../../shared/middlewares/auth';

export class ScheduleController {
  private scheduleService: ScheduleService;

  constructor() {
    this.scheduleService = new ScheduleService();
  }

  getSchedule = async (req: AuthRequest, res: Response) => {
    try {
      const { date, technicianId } = req.query;
      const scheduleDate = date ? new Date(date as string) : undefined;
      
      const schedules = await this.scheduleService.getSchedule(
        req.user!.tenantId,
        scheduleDate,
        technicianId as string
      );
      
      res.json({ data: schedules });
    } catch (error: any) {
      Logger.error('Get schedule error:', error);
      res.status(400).json({ error: error.message || 'Failed to get schedule' });
    }
  };

  getScheduleById = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const schedule = await this.scheduleService.getScheduleById(id, req.user!.tenantId);
      
      if (!schedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }
      
      res.json({ data: schedule });
    } catch (error: any) {
      Logger.error('Get schedule by id error:', error);
      res.status(400).json({ error: error.message || 'Failed to get schedule' });
    }
  };

  createSchedule = async (req: AuthRequest, res: Response) => {
    try {
      const { technicianId, bookingId, serviceId, startTime, endTime, notes } = req.body;
      
      const schedule = await this.scheduleService.createSchedule({
        tenantId: req.user!.tenantId,
        technicianId,
        bookingId,
        serviceId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        notes,
      });
      
      res.status(201).json({ data: schedule });
    } catch (error: any) {
      Logger.error('Create schedule error:', error);
      res.status(400).json({ error: error.message || 'Failed to create schedule' });
    }
  };

  updateSchedule = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { technicianId, startTime, endTime, notes } = req.body;
      
      const schedule = await this.scheduleService.updateSchedule(id, req.user!.tenantId, {
        technicianId,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        notes,
      });
      
      res.json({ data: schedule });
    } catch (error: any) {
      Logger.error('Update schedule error:', error);
      res.status(400).json({ error: error.message || 'Failed to update schedule' });
    }
  };

  startTask = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const schedule = await this.scheduleService.startTask(id, req.user!.tenantId);
      res.json({ data: schedule });
    } catch (error: any) {
      Logger.error('Start task error:', error);
      res.status(400).json({ error: error.message || 'Failed to start task' });
    }
  };

  completeTask = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const schedule = await this.scheduleService.completeTask(id, req.user!.tenantId);
      res.json({ data: schedule });
    } catch (error: any) {
      Logger.error('Complete task error:', error);
      res.status(400).json({ error: error.message || 'Failed to complete task' });
    }
  };

  cancelTask = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const schedule = await this.scheduleService.cancelTask(id, req.user!.tenantId);
      res.json({ data: schedule });
    } catch (error: any) {
      Logger.error('Cancel task error:', error);
      res.status(400).json({ error: error.message || 'Failed to cancel task' });
    }
  };

  createScheduleForBooking = async (req: AuthRequest, res: Response) => {
    try {
      const { bookingId, technicianId, scheduledDate } = req.body;
      
      const schedules = await this.scheduleService.createScheduleForBooking(
        bookingId,
        req.user!.tenantId,
        technicianId,
        new Date(scheduledDate)
      );
      
      res.status(201).json({ data: schedules });
    } catch (error: any) {
      Logger.error('Create schedule for booking error:', error);
      res.status(400).json({ error: error.message || 'Failed to create schedule for booking' });
    }
  };
}
