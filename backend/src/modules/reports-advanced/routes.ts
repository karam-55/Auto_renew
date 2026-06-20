import { Router } from 'express';
import { AdvancedReportsController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';

const router = Router();

// Helper to get controller
const getController = () => {
  return new AdvancedReportsController();
};

// All reports endpoints require authentication
router.use(authenticate);

// GET /api/reports/advanced - Get available advanced reports
router.get('/', authorize(['OWNER', 'MANAGER', 'ADMIN']), (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      reports: ['revenue', 'inventory', 'mechanic-performance', 'financial', 'customer-insights'],
    },
  });
});

// Revenue report - Owner, Manager, Admin
router.get('/revenue', authorize(['OWNER', 'MANAGER', 'ADMIN']), (req, res) => getController().getRevenueReport(req as any, res));

// Inventory report - Owner, Manager, Admin
router.get('/inventory', authorize(['OWNER', 'MANAGER', 'ADMIN']), (req, res) => getController().getInventoryReport(req as any, res));

// Mechanic performance - Owner, Manager, Admin
router.get('/mechanic-performance', authorize(['OWNER', 'MANAGER', 'ADMIN']), (req, res) => getController().getMechanicPerformanceReport(req as any, res));

// Financial report - Owner, Admin
router.get('/financial', authorize(['OWNER', 'ADMIN']), (req, res) => getController().getFinancialReport(req as any, res));

// Customer insights - Owner, Manager, Admin
router.get('/customer-insights', authorize(['OWNER', 'MANAGER', 'ADMIN']), (req, res) => getController().getCustomerInsightsReport(req as any, res));

export default router;
