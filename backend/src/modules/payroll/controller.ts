import { Request, Response } from 'express';
import { PayrollService } from './service';
import { AuthRequest } from '../../shared/middlewares/auth';
import { Logger } from '../../infrastructure/logging/logger';

export class PayrollController {
  private payrollService: PayrollService;

  constructor() {
    this.payrollService = new PayrollService();
  }

  getAllPayrollRecords = async (req: AuthRequest, res: Response) => {
    try {
      const payrollRecords = await this.payrollService.getAllPayrollRecords(req.user!.tenantId);
      res.json({ payrollRecords });
    } catch (error) {
      Logger.error('Get all payroll records error:', error);
      res.status(500).json({ error: 'Failed to fetch payroll records' });
    }
  };

  getPayrollRecordById = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const payrollRecord = await this.payrollService.getPayrollRecordById(req.user!.tenantId, id);

      if (!payrollRecord) {
        return res.status(404).json({ error: 'Payroll record not found' });
      }

      res.json({ payrollRecord });
    } catch (error) {
      Logger.error('Get payroll record error:', error);
      res.status(500).json({ error: 'Failed to fetch payroll record' });
    }
  };

  getPayrollRecordsByEmployee = async (req: AuthRequest, res: Response) => {
    try {
      const { employeeId } = req.params;
      const payrollRecords = await this.payrollService.getPayrollRecordsByEmployee(req.user!.tenantId, employeeId);
      res.json({ payrollRecords });
    } catch (error) {
      Logger.error('Get payroll records by employee error:', error);
      res.status(500).json({ error: 'Failed to fetch payroll records by employee' });
    }
  };

  getPayrollRecordsByPeriod = async (req: AuthRequest, res: Response) => {
    try {
      const { periodStart, periodEnd } = req.query;
      if (!periodStart || !periodEnd || typeof periodStart !== 'string' || typeof periodEnd !== 'string') {
        return res.status(400).json({ error: 'periodStart and periodEnd are required' });
      }

      const payrollRecords = await this.payrollService.getPayrollRecordsByPeriod(
        req.user!.tenantId,
        new Date(periodStart),
        new Date(periodEnd)
      );
      res.json({ payrollRecords });
    } catch (error) {
      Logger.error('Get payroll records by period error:', error);
      res.status(500).json({ error: 'Failed to fetch payroll records by period' });
    }
  };

  createPayrollRecord = async (req: AuthRequest, res: Response) => {
    try {
      const payrollRecord = await this.payrollService.createPayrollRecord(req.user!.tenantId, req.body);
      res.status(201).json({ payrollRecord });
    } catch (error: any) {
      Logger.error('Create payroll record error:', error);
      res.status(400).json({ error: error.message || 'Failed to create payroll record' });
    }
  };

  updatePayrollRecord = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const payrollRecord = await this.payrollService.updatePayrollRecord(req.user!.tenantId, id, req.body);
      res.json({ payrollRecord });
    } catch (error: any) {
      Logger.error('Update payroll record error:', error);
      res.status(400).json({ error: error.message || 'Failed to update payroll record' });
    }
  };

  deletePayrollRecord = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await this.payrollService.deletePayrollRecord(req.user!.tenantId, id);
      res.json({ message: 'Payroll record deleted successfully' });
    } catch (error: any) {
      Logger.error('Delete payroll record error:', error);
      res.status(400).json({ error: error.message || 'Failed to delete payroll record' });
    }
  };

  approvePayrollRecord = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const payrollRecord = await this.payrollService.approvePayrollRecord(req.user!.tenantId, id);
      res.json({ payrollRecord });
    } catch (error: any) {
      Logger.error('Approve payroll record error:', error);
      res.status(400).json({ error: error.message || 'Failed to approve payroll record' });
    }
  };

  markAsPaid = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const payrollRecord = await this.payrollService.markAsPaid(req.user!.tenantId, id, req.user!.id);
      res.json({ payrollRecord });
    } catch (error: any) {
      Logger.error('Mark payroll as paid error:', error);
      res.status(400).json({ error: error.message || 'Failed to mark payroll as paid' });
    }
  };
}
