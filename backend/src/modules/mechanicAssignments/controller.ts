import { Request, Response } from 'express';
import { Logger } from '../../infrastructure/logging/logger';
import { MechanicAssignmentService } from './service';
import { AuthRequest } from '../../shared/middlewares/auth';

export class MechanicAssignmentController {
  private mechanicAssignmentService: MechanicAssignmentService;

  constructor(io?: any) {
    this.mechanicAssignmentService = new MechanicAssignmentService(io);
  }

  getAllMechanicAssignments = async (req: AuthRequest, res: Response) => {
    try {
      const filters: any = {};
      if (req.query.bookingId) filters.bookingId = req.query.bookingId as string;
      if (req.query.mechanicUserId) filters.mechanicUserId = req.query.mechanicUserId as string;

      const assignments = await this.mechanicAssignmentService.getAllMechanicAssignments(req.user?.tenantId, filters);
      res.json({ assignments });
    } catch (error) {
      Logger.error('Get all mechanic assignments error:', error);
      res.status(500).json({ error: 'Failed to fetch mechanic assignments' });
    }
  };

  getMechanicAssignmentById = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const assignment = await this.mechanicAssignmentService.getMechanicAssignmentById(id);

      if (!assignment) {
        return res.status(404).json({ error: 'Mechanic assignment not found' });
      }

      res.json({ assignment });
    } catch (error) {
      Logger.error('Get mechanic assignment error:', error);
      res.status(500).json({ error: 'Failed to fetch mechanic assignment' });
    }
  };

  getAssignmentsByMechanic = async (req: AuthRequest, res: Response) => {
    try {
      const { mechanicId } = req.params;
      const assignments = await this.mechanicAssignmentService.getAssignmentsByMechanic(mechanicId);
      res.json({ assignments });
    } catch (error) {
      Logger.error('Get assignments by mechanic error:', error);
      res.status(500).json({ error: 'Failed to fetch assignments' });
    }
  };

  getAssignmentsByBooking = async (req: AuthRequest, res: Response) => {
    try {
      const { bookingId } = req.params;
      const assignments = await this.mechanicAssignmentService.getAssignmentsByBooking(bookingId);
      res.json({ assignments });
    } catch (error) {
      Logger.error('Get assignments by booking error:', error);
      res.status(500).json({ error: 'Failed to fetch assignments' });
    }
  };

  createMechanicAssignment = async (req: AuthRequest, res: Response) => {
    try {
      const assignment = await this.mechanicAssignmentService.createMechanicAssignment(req.user!.tenantId, req.body);
      res.status(201).json({ assignment });
    } catch (error: any) {
      Logger.error('Create mechanic assignment error:', error);
      res.status(400).json({ error: error.message || 'Failed to create mechanic assignment' });
    }
  };

  updateMechanicAssignment = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const assignment = await this.mechanicAssignmentService.updateMechanicAssignment(id, req.body);
      res.json({ assignment });
    } catch (error: any) {
      Logger.error('Update mechanic assignment error:', error);
      res.status(400).json({ error: error.message || 'Failed to update mechanic assignment' });
    }
  };

  deleteMechanicAssignment = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await this.mechanicAssignmentService.deleteMechanicAssignment(id);
      res.json({ message: 'Mechanic assignment deleted successfully' });
    } catch (error: any) {
      Logger.error('Delete mechanic assignment error:', error);
      res.status(400).json({ error: error.message || 'Failed to delete mechanic assignment' });
    }
  };
}
