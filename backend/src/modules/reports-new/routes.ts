import { Router } from 'express';
import { ReportsController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get report summary (accessible by OWNER, MANAGER)
router.get('/summary', authorize(['OWNER', 'MANAGER']), (req, res) => {
  const controller = new ReportsController();
  controller.getReportSummary(req, res);
});

// Create report (accessible by OWNER, MANAGER)
router.post('/', authorize(['OWNER', 'MANAGER']), (req, res) => {
  const controller = new ReportsController();
  controller.createReport(req, res);
});

// Get reports for tenant (accessible by OWNER, MANAGER)
router.get('/', authorize(['OWNER', 'MANAGER']), (req, res) => {
  const controller = new ReportsController();
  controller.getReports(req, res);
});

// Get report by ID (accessible by all authenticated users)
router.get('/:id', tenantGuard('ReportTemplate'), (req, res) => {
  const controller = new ReportsController();
  controller.getReport(req, res);
});

// Generate report (accessible by OWNER, MANAGER)
router.post('/:id/generate', authorize(['OWNER', 'MANAGER']), tenantGuard('ReportTemplate'), (req, res) => {
  const controller = new ReportsController();
  controller.generateReport(req, res);
});

// Delete report (accessible by OWNER, MANAGER)
router.delete('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('ReportTemplate'), (req, res) => {
  const controller = new ReportsController();
  controller.deleteReport(req, res);
});

export default router;
