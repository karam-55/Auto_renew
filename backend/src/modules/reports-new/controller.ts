import { Request, Response } from 'express';
import { ReportsService } from '../reporting/reports.service';

export class ReportsController {
  private service = new ReportsService();

  async createReport(req: Request, res: Response) {
    try {
      const { tenantId, name, nameAr, description, reportType, format, parameters, generatedBy } = req.body;
      const report = await this.service.createReport(
        tenantId,
        name,
        nameAr,
        description,
        reportType,
        format,
        parameters,
        generatedBy
      );
      res.status(201).json(report);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create report' });
    }
  }

  async getReport(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const report = await this.service.getReport(id);
      if (!report) {
        res.status(404).json({ error: 'Report not found' });
        return;
      }
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch report' });
    }
  }

  async getReports(req: Request, res: Response) {
    try {
      const { tenantId, reportType, status, limit, offset } = req.query;
      const reports = await this.service.getReports(
        tenantId as string,
        reportType as 'FINANCIAL' | 'OPERATIONAL' | 'CUSTOMER' | 'INVENTORY' | 'EMPLOYEE' | 'CUSTOM' | undefined,
        status as 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED' | undefined,
        parseInt(limit as string) || 50,
        parseInt(offset as string) || 0
      );
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  }

  async generateReport(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const report = await this.service.generateReport(id);
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate report' });
    }
  }

  async deleteReport(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.service.deleteReport(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete report' });
    }
  }

  async getReportSummary(req: Request, res: Response) {
    try {
      const { tenantId } = req.query;
      const summary = await this.service.getReportSummary(tenantId as string);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch report summary' });
    }
  }
}
