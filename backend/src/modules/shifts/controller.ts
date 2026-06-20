import { Request, Response } from 'express';
import { Logger } from '../../infrastructure/logging/logger';
import { ShiftService } from './service';
import { AuthRequest } from '../../shared/middlewares/auth';

export class ShiftController {
  private shiftService: ShiftService;

  constructor() {
    this.shiftService = new ShiftService();
  }

  getAllShifts = async (req: AuthRequest, res: Response) => {
    try {
      const shifts = await this.shiftService.getAllShifts(req.user!.tenantId);
      res.json({ shifts });
    } catch (error) {
      Logger.error('Get all shifts error:', error);
      res.status(500).json({ error: 'Failed to fetch shifts' });
    }
  };

  getShiftById = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const shift = await this.shiftService.getShiftById(req.user!.tenantId, id);

      if (!shift) {
        return res.status(404).json({ error: 'Shift not found' });
      }

      res.json({ shift });
    } catch (error) {
      Logger.error('Get shift error:', error);
      res.status(500).json({ error: 'Failed to fetch shift' });
    }
  };

  searchShifts = async (req: AuthRequest, res: Response) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Search query required' });
      }

      const shifts = await this.shiftService.searchShifts(req.user!.tenantId, q);
      res.json({ shifts });
    } catch (error) {
      Logger.error('Search shifts error:', error);
      res.status(500).json({ error: 'Failed to search shifts' });
    }
  };

  createShift = async (req: AuthRequest, res: Response) => {
    try {
      const shift = await this.shiftService.createShift(req.user!.tenantId, req.body);
      res.status(201).json({ shift });
    } catch (error: any) {
      Logger.error('Create shift error:', error);
      res.status(400).json({ error: error.message || 'Failed to create shift' });
    }
  };

  updateShift = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const shift = await this.shiftService.updateShift(req.user!.tenantId, id, req.body);
      res.json({ shift });
    } catch (error: any) {
      Logger.error('Update shift error:', error);
      res.status(400).json({ error: error.message || 'Failed to update shift' });
    }
  };

  deleteShift = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await this.shiftService.deleteShift(req.user!.tenantId, id);
      res.json({ message: 'Shift deleted successfully' });
    } catch (error: any) {
      Logger.error('Delete shift error:', error);
      res.status(400).json({ error: error.message || 'Failed to delete shift' });
    }
  };
}
