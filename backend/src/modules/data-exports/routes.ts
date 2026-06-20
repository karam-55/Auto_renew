import { Router } from 'express';
import { DataExportsController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get export summary (accessible by OWNER, MANAGER)
router.get('/summary', authorize(['OWNER', 'MANAGER']), (req, res) => {
  const controller = new DataExportsController();
  controller.getExportSummary(req, res);
});

// Create data export (accessible by OWNER, MANAGER)
router.post('/', authorize(['OWNER', 'MANAGER']), (req, res) => {
  const controller = new DataExportsController();
  controller.createExport(req, res);
});

// Get exports for tenant (accessible by OWNER, MANAGER)
router.get('/', authorize(['OWNER', 'MANAGER']), (req, res) => {
  const controller = new DataExportsController();
  controller.getExports(req, res);
});

// Get export by ID (accessible by all authenticated users)
router.get('/:id', tenantGuard('DataExport'), (req, res) => {
  const controller = new DataExportsController();
  controller.getExport(req, res);
});

// Process export (accessible by OWNER, MANAGER)
router.post('/:id/process', authorize(['OWNER', 'MANAGER']), tenantGuard('DataExport'), (req, res) => {
  const controller = new DataExportsController();
  controller.processExport(req, res);
});

// Delete export (accessible by OWNER, MANAGER)
router.delete('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('DataExport'), (req, res) => {
  const controller = new DataExportsController();
  controller.deleteExport(req, res);
});

export default router;
