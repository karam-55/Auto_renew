import { Router } from 'express';
import { MaintenanceController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Initialize controller with io (will be set after server starts)
let maintenanceControllerInstance: MaintenanceController;

export const initMaintenanceRoutes = (io: any) => {
  maintenanceControllerInstance = new MaintenanceController();
  maintenanceControllerInstance.setIo(io);
};

// Helper to get controller
const getController = () => {
  if (!maintenanceControllerInstance) {
    maintenanceControllerInstance = new MaintenanceController();
  }
  return maintenanceControllerInstance;
};

// GET /api/maintenance - List maintenance logs
router.get('/', (req, res) => getController().getLogs(req, res));

// ============================================
// TEMPLATES
// ============================================

router.post('/templates', authorize(['OWNER', 'MANAGER']), (req, res) => getController().createTemplate(req, res));
router.get('/templates', (req, res) => getController().getTemplates(req, res));
router.get('/templates/:id', tenantGuard('MaintenanceTemplate'), (req, res) => getController().getTemplateById(req, res));
router.put('/templates/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('MaintenanceTemplate'), (req, res) => getController().updateTemplate(req, res));
router.delete('/templates/:id', authorize(['OWNER']), tenantGuard('MaintenanceTemplate'), (req, res) => getController().deleteTemplate(req, res));

// ============================================
// LOGS
// ============================================

router.post('/logs', authorize(['OWNER', 'MANAGER']), (req, res) => getController().createLog(req, res));
router.get('/logs', (req, res) => getController().getLogs(req, res));
router.get('/logs/:id', tenantGuard('PreventiveMaintenanceLog'), (req, res) => getController().getLogById(req, res));
router.put('/logs/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('PreventiveMaintenanceLog'), (req, res) => getController().updateLog(req, res));
router.delete('/logs/:id', authorize(['OWNER']), tenantGuard('PreventiveMaintenanceLog'), (req, res) => getController().deleteLog(req, res));

// ============================================
// REMINDERS
// ============================================

router.post('/reminders/send', authorize(['OWNER', 'MANAGER']), (req, res) => getController().sendReminders(req, res));
router.get('/reminders/upcoming', (req, res) => getController().getUpcomingMaintenances(req, res));

// ============================================
// COMPLETION
// ============================================

router.post('/logs/:id/complete', authorize(['OWNER', 'MANAGER']), tenantGuard('PreventiveMaintenanceLog'), (req, res) => getController().completeMaintenance(req, res));

export default router;
