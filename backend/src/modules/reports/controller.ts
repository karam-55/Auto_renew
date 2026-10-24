import { Request, Response } from 'express';
import { ReportService } from './service';
import { AuthRequest } from '../../shared/middlewares/auth';
import { Logger } from '../../infrastructure/logging/logger';
import { ProfitabilityService } from './profitability.service';
import {
  BalanceSheetRequest,
  ProfitLossRequest,
  CashFlowRequest,
  TrialBalanceRequest,
  AgedReceivablesRequest,
  AgedPayablesRequest,
} from './types';

function parseReportDate(value: unknown, fallback: Date, endOfDay = false): Date {
  if (value == null || value === '') return fallback;
  const raw = String(value);
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
  return new Date(dateOnly
    ? `${raw}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`
    : raw);
}

export class ReportController {
  private reportService: ReportService;
  private profitabilityService: ProfitabilityService;

  constructor() {
    this.reportService = new ReportService();
    this.profitabilityService = new ProfitabilityService();
  }

  // ============================================
  // BALANCE SHEET
  // ============================================

  getBalanceSheet = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;

      // Handle date parameters with defaults
      const now = new Date();
      const fromDate = parseReportDate(req.query.fromDate, new Date(Date.UTC(now.getUTCFullYear(), 0, 1)));
      const toDate = parseReportDate(req.query.toDate, now, true);

      // Validate dates
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        res.status(400).json({
          success: false,
          error: 'Invalid date format. Use ISO-8601 format (YYYY-MM-DD)',
        });
        return;
      }

      const request: BalanceSheetRequest = {
        fromDate,
        toDate,
        currency: req.query.currency as string,
      };

      const report = await this.reportService.generateBalanceSheet(tenantId, request);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      Logger.error('Get balance sheet error', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate balance sheet',
      });
    }
  };

  exportBalanceSheetPDF = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const request: BalanceSheetRequest = {
        fromDate: parseReportDate(req.query.fromDate, new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1))),
        toDate: parseReportDate(req.query.toDate, new Date(), true),
        currency: req.query.currency as string,
      };

      const { buffer, filename } = await this.reportService.exportBalanceSheetToPDF(tenantId, request);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      Logger.error('Export balance sheet PDF error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export balance sheet to PDF',
      });
    }
  };

  exportBalanceSheetExcel = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const request: BalanceSheetRequest = {
        fromDate: parseReportDate(req.query.fromDate, new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1))),
        toDate: parseReportDate(req.query.toDate, new Date(), true),
        currency: req.query.currency as string,
      };

      const { buffer, filename } = await this.reportService.exportBalanceSheetToExcel(tenantId, request);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      Logger.error('Export balance sheet Excel error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export balance sheet to Excel',
      });
    }
  };

  // ============================================
  // PROFIT & LOSS
  // ============================================

  getProfitLoss = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      
      // Handle date parameters with defaults
      const now = new Date();
      const fromDate = parseReportDate(req.query.fromDate, new Date(Date.UTC(now.getUTCFullYear(), 0, 1)));
      const toDate = parseReportDate(req.query.toDate, now, true);
      
      // Validate dates
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        res.status(400).json({
          success: false,
          error: 'Invalid date format. Use ISO-8601 format (YYYY-MM-DD)',
        });
        return;
      }

      const request: ProfitLossRequest = {
        fromDate,
        toDate,
        currency: req.query.currency as string,
      };

      const report = await this.reportService.generateProfitLoss(tenantId, request);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      Logger.error('Get profit loss error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate profit & loss statement',
      });
    }
  };

  // ============================================
  // CASH FLOW
  // ============================================

  getCashFlow = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const request: CashFlowRequest = {
        fromDate: parseReportDate(req.query.fromDate, new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1))),
        toDate: parseReportDate(req.query.toDate, new Date(), true),
        currency: req.query.currency as string,
      };

      const report = await this.reportService.generateCashFlow(tenantId, request);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      Logger.error('Get cash flow error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate cash flow statement',
      });
    }
  };

  // ============================================
  // TRIAL BALANCE
  // ============================================

  getTrialBalance = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const request: TrialBalanceRequest = {
        fromDate: parseReportDate(req.query.fromDate, new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1))),
        toDate: parseReportDate(req.query.toDate, new Date(), true),
        currency: req.query.currency as string,
      };

      const report = await this.reportService.generateTrialBalance(tenantId, request);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      Logger.error('Get trial balance error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate trial balance',
      });
    }
  };

  // ============================================
  // AGED RECEIVABLES
  // ============================================

  getAgedReceivables = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const request: AgedReceivablesRequest = {
        asOfDate: parseReportDate(req.query.asOfDate, new Date(), true),
        currency: req.query.currency as string,
      };

      const report = await this.reportService.generateAgedReceivables(tenantId, request);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      Logger.error('Get aged receivables error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate aged receivables report',
      });
    }
  };

  // ============================================
  // AGED PAYABLES
  // ============================================

  getAgedPayables = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const request: AgedPayablesRequest = {
        asOfDate: parseReportDate(req.query.asOfDate, new Date(), true),
        currency: req.query.currency as string,
      };

      const report = await this.reportService.generateAgedPayables(tenantId, request);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      Logger.error('Get aged payables error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate aged payables report',
      });
    }
  };

  getCustomerStatement = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const from = parseReportDate(req.query.from, new Date(0));
      const to = parseReportDate(req.query.to, new Date(), true);
      const data = await this.reportService.getCustomerStatement(
        req.user!.tenantId,
        req.params.customerId,
        req.query.from ? from : undefined,
        req.query.to ? to : undefined,
      );
      res.json({ success: true, data });
    } catch (error: any) {
      Logger.error('Get customer statement error', error);
      res.status(400).json({ success: false, message: error.message || 'Failed to load customer statement' });
    }
  };

  getCashBankMovement = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const role = req.query.account === 'BANK' ? 'BANK' : 'CASH';
      const from = parseReportDate(req.query.from, new Date(0));
      const to = parseReportDate(req.query.to, new Date(), true);
      const data = await this.reportService.getCashBankMovement(req.user!.tenantId, role, req.query.from ? from : undefined, req.query.to ? to : undefined);
      res.json({ success: true, data });
    } catch (error: any) {
      Logger.error('Get cash/bank movement error', error);
      res.status(400).json({ success: false, message: error.message || 'Failed to load cash/bank movement' });
    }
  };

  // ============================================
  // INVENTORY REPORTS
  // ============================================

  getCurrentInventoryReport = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const branchId = req.query.branchId as string | undefined;
      const branchContext = (req as any).branchContext;
      
      // Use branch from context if not specified
      const effectiveBranchId = branchId || branchContext?.branchId;
      
      const report = await this.reportService.getCurrentInventoryReport(tenantId, effectiveBranchId);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      Logger.error('Get current inventory report error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate inventory report',
      });
    }
  };

  getPartsConsumptionReport = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const branchId = req.query.branchId as string | undefined;
      const branchContext = (req as any).branchContext;
      const effectiveBranchId = branchId || branchContext?.branchId;
      const fromDate = parseReportDate(req.query.from, new Date(0));
      const toDate = parseReportDate(req.query.to, new Date(), true);

      const report = await this.reportService.getPartsConsumptionReport(tenantId, effectiveBranchId, req.query.from ? fromDate : undefined, req.query.to ? toDate : undefined);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      Logger.error('Get parts consumption report error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate consumption report',
      });
    }
  };

  getStockMovementsReport = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const branchId = req.query.branchId as string | undefined;
      const branchContext = (req as any).branchContext;
      const effectiveBranchId = branchId || branchContext?.branchId;
      const fromDate = parseReportDate(req.query.from, new Date(0));
      const toDate = parseReportDate(req.query.to, new Date(), true);
      const type = req.query.type as string | undefined;

      const report = await this.reportService.getStockMovementsReport(tenantId, effectiveBranchId, req.query.from ? fromDate : undefined, req.query.to ? toDate : undefined, type);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      Logger.error('Get stock movements report error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate stock movements report',
      });
    }
  };

  getServiceCostReport = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const branchId = req.query.branchId as string | undefined;
      const branchContext = (req as any).branchContext;
      const effectiveBranchId = branchId || branchContext?.branchId;
      const fromDate = parseReportDate(req.query.from, new Date(0));
      const toDate = parseReportDate(req.query.to, new Date(), true);

      const report = await this.reportService.getServiceCostReport(tenantId, effectiveBranchId, req.query.from ? fromDate : undefined, req.query.to ? toDate : undefined);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      Logger.error('Get service cost report error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate service cost report',
      });
    }
  };

  getProfitabilityReport = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const branchId = req.query.branchId as string | undefined;
      const branchContext = (req as any).branchContext;
      const effectiveBranchId = branchId || branchContext?.branchId;
      const fromDate = parseReportDate(req.query.from, new Date(0));
      const toDate = parseReportDate(req.query.to, new Date(), true);

      const [services, workOrders, departments] = await Promise.all([
        this.profitabilityService.calculateServiceProfit(tenantId, req.query.from ? fromDate : undefined, req.query.to ? toDate : undefined),
        this.profitabilityService.calculateWorkOrderProfit(tenantId, req.query.from ? fromDate : undefined, req.query.to ? toDate : undefined),
        this.profitabilityService.calculateDepartmentProfit(tenantId, req.query.from ? fromDate : undefined, req.query.to ? toDate : undefined),
      ]);
      const report = { services, workOrders, departments, branchId: effectiveBranchId || null };

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      Logger.error('Get profitability report error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate profitability report',
      });
    }
  };

  // ============================================
  // CONSOLIDATED REPORTS (Unified Reports)
  // ============================================

  getConsolidatedReport = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const type = req.query.type as string;

      // Validate report type
      const validTypes = ['sales', 'profitability', 'inventory', 'expenses', 'memberships'];
      if (!type || !validTypes.includes(type)) {
        res.status(400).json({
          success: false,
          error: `Invalid report type. Must be one of: ${validTypes.join(', ')}`,
        });
        return;
      }

      let report: any;

      switch (type) {
        case 'sales':
          report = await this.reportService.getConsolidatedSalesReport(tenantId);
          break;
        case 'profitability':
          report = await this.reportService.getConsolidatedProfitabilityReport(tenantId);
          break;
        case 'inventory':
          report = await this.reportService.getConsolidatedInventoryReport(tenantId);
          break;
        case 'expenses':
          report = await this.reportService.getConsolidatedExpensesReport(tenantId);
          break;
        case 'memberships':
          report = await this.reportService.getConsolidatedMembershipsReport(tenantId);
          break;
        default:
          res.status(400).json({
            success: false,
            error: 'Invalid report type',
          });
          return;
      }

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      Logger.error('Get consolidated report error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate consolidated report',
      });
    }
  };
}
