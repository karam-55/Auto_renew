import { Request, Response } from 'express';
import { EmployeeService } from './service';
import { AuthRequest } from '../../shared/middlewares/auth';
import { Logger } from '../../infrastructure/logging/logger';

export class EmployeeController {
  private employeeService: EmployeeService;

  constructor() {
    this.employeeService = new EmployeeService();
  }

  getAllEmployees = async (req: AuthRequest, res: Response) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
      const { employees, total } = await this.employeeService.getAllEmployees(req.user!.tenantId, page, limit);
      res.json({
        data: employees,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      Logger.error('Get all employees error', error);
      res.status(500).json({ error: 'Failed to fetch employees' });
    }
  };

  getEmployeeById = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const employee = await this.employeeService.getEmployeeById(req.user!.tenantId, id);

      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      res.json({ employee });
    } catch (error) {
      Logger.error('Get employee error:', error);
      res.status(500).json({ error: 'Failed to fetch employee' });
    }
  };

  searchEmployees = async (req: AuthRequest, res: Response) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Search query required' });
      }

      const employees = await this.employeeService.searchEmployees(req.user!.tenantId, q);
      res.json({ employees });
    } catch (error) {
      Logger.error('Search employees error:', error);
      res.status(500).json({ error: 'Failed to search employees' });
    }
  };

  getEmployeesByDepartment = async (req: AuthRequest, res: Response) => {
    try {
      const { departmentId } = req.params;
      const employees = await this.employeeService.getEmployeesByDepartment(req.user!.tenantId, departmentId);
      res.json({ employees });
    } catch (error) {
      Logger.error('Get employees by department error:', error);
      res.status(500).json({ error: 'Failed to fetch employees by department' });
    }
  };

  createEmployee = async (req: AuthRequest, res: Response) => {
    try {
      const employee = await this.employeeService.createEmployee(req.user!.tenantId, req.body);
      res.status(201).json({ employee });
    } catch (error: any) {
      Logger.error('Create employee error:', error);
      res.status(400).json({ error: error.message || 'Failed to create employee' });
    }
  };

  updateEmployee = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const employee = await this.employeeService.updateEmployee(req.user!.tenantId, id, req.body);
      res.json({ employee });
    } catch (error: any) {
      Logger.error('Update employee error:', error);
      res.status(400).json({ error: error.message || 'Failed to update employee' });
    }
  };

  deleteEmployee = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await this.employeeService.deleteEmployee(req.user!.tenantId, id);
      res.json({ message: 'Employee deleted successfully' });
    } catch (error: any) {
      Logger.error('Delete employee error:', error);
      res.status(400).json({ error: error.message || 'Failed to delete employee' });
    }
  };

  bulkDeleteEmployees = async (req: AuthRequest, res: Response) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'IDs array is required' });
      }
      const result = await this.employeeService.bulkDeleteEmployees(req.user!.tenantId, ids);
      res.json({
        message: `Deleted ${result.deleted} employees, ${result.failed} failed`,
        ...result
      });
    } catch (error: any) {
      Logger.error('Bulk delete employees error:', error);
      res.status(400).json({ error: error.message || 'Failed to delete employees' });
    }
  };

  assignRole = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { roleId } = req.body;

      if (!roleId) {
        return res.status(400).json({ error: 'roleId is required' });
      }

      const employee = await this.employeeService.assignRole(req.user!.tenantId, id, roleId);
      res.json({ message: 'Role assigned successfully', employee });
    } catch (error: any) {
      Logger.error('Assign role error:', error);
      res.status(400).json({ error: error.message || 'Failed to assign role' });
    }
  };
}
