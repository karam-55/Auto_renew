import { Request, Response } from 'express';
import { DataExportService } from '../data/data-export.service';

export class DataExportsController {
  private service = new DataExportService();

  async createExport(req: Request, res: Response) {
    try {
      const { tenantId, name, entityType, format, filters, requestedBy } = req.body;
      const dataExport = await this.service.createExport(
        tenantId,
        name,
        entityType,
        format,
        filters,
        requestedBy
      );
      res.status(201).json(dataExport);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create data export' });
    }
  }

  async getExport(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const dataExport = await this.service.getExport(id);
      if (!dataExport) {
        res.status(404).json({ error: 'Data export not found' });
        return;
      }
      res.json(dataExport);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch data export' });
    }
  }

  async getExports(req: Request, res: Response) {
    try {
      const { tenantId, entityType, status, limit, offset } = req.query;
      const exports = await this.service.getExports(
        tenantId as string,
        entityType as 'INVENTORY' | 'BOOKINGS' | 'CUSTOMERS' | 'INVOICES' | 'PAYMENTS' | 'EMPLOYEES' | 'SERVICES' | undefined,
        status as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | undefined,
        parseInt(limit as string) || 50,
        parseInt(offset as string) || 0
      );
      res.json(exports);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch data exports' });
    }
  }

  async processExport(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const dataExport = await this.service.processExport(id);
      res.json(dataExport);
    } catch (error) {
      res.status(500).json({ error: 'Failed to process data export' });
    }
  }

  async deleteExport(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.service.deleteExport(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete data export' });
    }
  }

  async getExportSummary(req: Request, res: Response) {
    try {
      const { tenantId } = req.query;
      const summary = await this.service.getExportSummary(tenantId as string);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch export summary' });
    }
  }
}
