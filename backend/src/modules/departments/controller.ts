import { Request, Response } from 'express';
import { DepartmentService } from './service';
import { AuthRequest } from '../../shared/middlewares/auth';
import { Logger } from '../../infrastructure/logging/logger';
import { getPaginationParams, createPaginatedResponse } from '../../shared/utils/pagination';

export class DepartmentController {
  private departmentService: DepartmentService;

  constructor() {
    this.departmentService = new DepartmentService();
  }

  getAllDepartments = async (req: AuthRequest, res: Response) => {
    try {
      const { page, limit, skip } = getPaginationParams(req);
      const [departments, total] = await Promise.all([
        this.departmentService.getAllDepartments(req.user!.tenantId, skip, limit),
        this.departmentService.getDepartmentsCount(req.user!.tenantId),
      ]);
      res.json(createPaginatedResponse(departments, total, page, limit));
    } catch (error) {
      Logger.error('Get all departments error', error);
      res.status(500).json({ error: 'Failed to fetch departments' });
    }
  };

  getDepartmentById = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const department = await this.departmentService.getDepartmentById(req.user!.tenantId, id);

      if (!department) {
        return res.status(404).json({ error: 'Department not found' });
      }

      res.json({ department });
    } catch (error) {
      Logger.error('Get department error', error);
      res.status(500).json({ error: 'Failed to fetch department' });
    }
  };

  searchDepartments = async (req: AuthRequest, res: Response) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Search query required' });
      }

      const departments = await this.departmentService.searchDepartments(req.user!.tenantId, q);
      res.json({ departments });
    } catch (error) {
      Logger.error('Search departments error:', error);
      res.status(500).json({ error: 'Failed to search departments' });
    }
  };

  createDepartment = async (req: AuthRequest, res: Response) => {
    try {
      const department = await this.departmentService.createDepartment(req.user!.tenantId, req.body);
      res.status(201).json({ department });
    } catch (error: any) {
      Logger.error('Create department error:', error);
      res.status(400).json({ error: error.message || 'Failed to create department' });
    }
  };

  updateDepartment = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const department = await this.departmentService.updateDepartment(req.user!.tenantId, id, req.body);
      res.json({ department });
    } catch (error: any) {
      Logger.error('Update department error:', error);
      res.status(400).json({ error: error.message || 'Failed to update department' });
    }
  };

  deleteDepartment = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await this.departmentService.deleteDepartment(req.user!.tenantId, id);
      res.json({ message: 'Department deleted successfully' });
    } catch (error: any) {
      Logger.error('Delete department error:', error);
      res.status(400).json({ error: error.message || 'Failed to delete department' });
    }
  };

  bulkDeleteDepartments = async (req: AuthRequest, res: Response) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'IDs array is required' });
      }
      const result = await this.departmentService.bulkDeleteDepartments(req.user!.tenantId, ids);
      res.json({
        message: `Deleted ${result.deleted} departments, ${result.failed} failed`,
        ...result
      });
    } catch (error: any) {
      Logger.error('Bulk delete departments error:', error);
      res.status(400).json({ error: error.message || 'Failed to delete departments' });
    }
  };
}
