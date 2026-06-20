import { Router } from 'express';
import { ReportController } from './controller';
import { AdvancedReportsController } from '../reports-advanced/controller';
import { ProfitabilityController } from './profitability.controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();
const reportController = new ReportController();
const advancedReportsController = new AdvancedReportsController();
const profitabilityController = new ProfitabilityController();

// All routes require authentication
router.use(authenticate);

// All report routes require OWNER, MANAGER, or ACCOUNTANT role
router.use(authorize(['OWNER', 'MANAGER', 'ACCOUNTANT']));

// GET /api/reports - Get available reports list
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      reports: [
        'balance-sheet', 'profit-loss', 'cash-flow', 'trial-balance',
        'aged-receivables', 'aged-payables', 'inventory', 'consumption',
        'stock-movements', 'service-cost', 'profitability', 'consolidated',
      ],
    },
  });
});

// ============================================
// BALANCE SHEET
// ============================================

// GET /api/reports/balance-sheet?fromDate=&toDate=
router.get('/balance-sheet', reportController.getBalanceSheet);

// GET /api/reports/balance-sheet/export/pdf?fromDate=&toDate=
router.get('/balance-sheet/export/pdf', reportController.exportBalanceSheetPDF);

// GET /api/reports/balance-sheet/export/excel?fromDate=&toDate=
router.get('/balance-sheet/export/excel', reportController.exportBalanceSheetExcel);

// ============================================
// PROFIT & LOSS
// ============================================

// GET /api/reports/profit-loss?fromDate=&toDate=
router.get('/profit-loss', reportController.getProfitLoss);

// ============================================
// CASH FLOW
// ============================================

// GET /api/reports/cash-flow?fromDate=&toDate=
router.get('/cash-flow', reportController.getCashFlow);

// ============================================
// TRIAL BALANCE
// ============================================

// GET /api/reports/trial-balance?fromDate=&toDate=
router.get('/trial-balance', reportController.getTrialBalance);

// ============================================
// AGED RECEIVABLES
// ============================================

// GET /api/reports/aged-receivables?asOfDate=
router.get('/aged-receivables', reportController.getAgedReceivables);

// ============================================
// AGED PAYABLES
// ============================================

// GET /api/reports/aged-payables?asOfDate=
router.get('/aged-payables', reportController.getAgedPayables);

// ============================================
// ADVANCED REPORTS
// ============================================

// GET /api/reports/advanced/sales?dateFrom=&dateTo=&customerId=
router.get('/advanced/sales', (req, res) => advancedReportsController.getSalesReport(req, res));

// GET /api/reports/advanced/inventory
router.get('/advanced/inventory', (req, res) => advancedReportsController.getInventoryReport(req, res));

// GET /api/reports/advanced/performance?dateFrom=&dateTo=
router.get('/advanced/performance', (req, res) => advancedReportsController.getPerformanceReport(req, res));

// GET /api/reports/advanced/financial?dateFrom=&dateTo=
router.get('/advanced/financial', (req, res) => advancedReportsController.getFinancialReport(req, res));

// ============================================
// INVENTORY REPORTS
// ============================================

// GET /api/reports/inventory
router.get('/inventory', reportController.getCurrentInventoryReport);

// GET /api/reports/consumption?from=&to=
router.get('/consumption', reportController.getPartsConsumptionReport);

// GET /api/reports/stock-movements?from=&to=&type=
router.get('/stock-movements', reportController.getStockMovementsReport);

// GET /api/reports/service-cost?from=&to=
router.get('/service-cost', reportController.getServiceCostReport);

// GET /api/reports/profitability?from=&to=
router.get('/profitability', reportController.getProfitabilityReport);

// ============================================
// PROFITABILITY ENGINE (PHASE F)
// ============================================

// GET /api/reports/invoice-profit/:id
router.get('/invoice-profit/:id', tenantGuard('Invoice'), profitabilityController.getInvoiceProfit);

// GET /api/reports/service-profit?from=&to=
router.get('/service-profit', profitabilityController.getServiceProfit);

// GET /api/reports/technician-profit?from=&to=
router.get('/technician-profit', profitabilityController.getTechnicianProfit);

// GET /api/reports/customer-profit?from=&to=
router.get('/customer-profit', profitabilityController.getCustomerProfit);

// ============================================
// CONSOLIDATED REPORTS (Unified Reports)
// ============================================

// GET /api/reports/consolidated?type={sales|profitability|inventory|expenses|memberships}
router.get('/consolidated', reportController.getConsolidatedReport);

// ============================================
// BOOKINGS REPORT (Stub)
// ============================================

// GET /api/reports/bookings
router.get('/bookings', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      totalBookings: 0,
      completedBookings: 0,
      completionRate: '0%',
      averageTime: '0h',
      mechanicPerformance: [],
    },
  });
});

export default router;
