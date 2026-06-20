import { Request, Response } from 'express';
import { AttendanceService } from './service';
import { AuthRequest } from '../../shared/middlewares/auth';
import { Logger } from '../../infrastructure/logging/logger';

export class AttendanceController {
  private attendanceService: AttendanceService;

  constructor() {
    this.attendanceService = new AttendanceService();
  }

  getAllAttendance = async (req: AuthRequest, res: Response) => {
    try {
      const attendance = await this.attendanceService.getAllAttendance(req.user!.tenantId);
      res.json({ attendance });
    } catch (error) {
      Logger.error('Get all attendance error:', error);
      res.status(500).json({ error: 'Failed to fetch attendance' });
    }
  };

  getAttendanceById = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const attendance = await this.attendanceService.getAttendanceById(req.user!.tenantId, id);

      if (!attendance) {
        return res.status(404).json({ error: 'Attendance not found' });
      }

      res.json({ attendance });
    } catch (error) {
      Logger.error('Get attendance error:', error);
      res.status(500).json({ error: 'Failed to fetch attendance' });
    }
  };

  getAttendanceByEmployee = async (req: AuthRequest, res: Response) => {
    try {
      const { employeeId } = req.params;
      const { startDate, endDate } = req.query;
      
      const attendance = await this.attendanceService.getAttendanceByEmployee(
        req.user!.tenantId,
        employeeId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json({ attendance });
    } catch (error) {
      Logger.error('Get attendance by employee error:', error);
      res.status(500).json({ error: 'Failed to fetch attendance by employee' });
    }
  };

  getAttendanceByDate = async (req: AuthRequest, res: Response) => {
    try {
      const { date } = req.query;
      if (!date || typeof date !== 'string') {
        return res.status(400).json({ error: 'Date parameter required' });
      }

      const attendance = await this.attendanceService.getAttendanceByDate(req.user!.tenantId, new Date(date));
      res.json({ attendance });
    } catch (error) {
      Logger.error('Get attendance by date error:', error);
      res.status(500).json({ error: 'Failed to fetch attendance by date' });
    }
  };

  createAttendance = async (req: AuthRequest, res: Response) => {
    try {
      const attendance = await this.attendanceService.createAttendance(req.user!.tenantId, req.body);
      res.status(201).json({ attendance });
    } catch (error: any) {
      Logger.error('Create attendance error:', error);
      res.status(400).json({ error: error.message || 'Failed to create attendance' });
    }
  };

  updateAttendance = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const attendance = await this.attendanceService.updateAttendance(req.user!.tenantId, id, req.body);
      res.json({ attendance });
    } catch (error: any) {
      Logger.error('Update attendance error:', error);
      res.status(400).json({ error: error.message || 'Failed to update attendance' });
    }
  };

  deleteAttendance = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await this.attendanceService.deleteAttendance(req.user!.tenantId, id);
      res.json({ message: 'Attendance deleted successfully' });
    } catch (error: any) {
      Logger.error('Delete attendance error:', error);
      res.status(400).json({ error: error.message || 'Failed to delete attendance' });
    }
  };

  checkIn = async (req: AuthRequest, res: Response) => {
    try {
      const { employeeId } = req.params;
      const { checkInTime, shiftId } = req.body;
      
      if (!checkInTime) {
        return res.status(400).json({ error: 'checkInTime is required' });
      }

      const attendance = await this.attendanceService.checkIn(
        req.user!.tenantId,
        employeeId,
        new Date(checkInTime),
        shiftId
      );
      res.status(201).json({ attendance });
    } catch (error: any) {
      Logger.error('Check in error:', error);
      res.status(400).json({ error: error.message || 'Failed to check in' });
    }
  };

  checkOut = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { checkOutTime } = req.body;
      
      if (!checkOutTime) {
        return res.status(400).json({ error: 'checkOutTime is required' });
      }

      const attendance = await this.attendanceService.checkOut(
        req.user!.tenantId,
        id,
        new Date(checkOutTime)
      );
      res.json({ attendance });
    } catch (error: any) {
      Logger.error('Check out error:', error);
      res.status(400).json({ error: error.message || 'Failed to check out' });
    }
  };
}
