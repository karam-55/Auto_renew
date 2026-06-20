import { Router } from 'express';
import { NotificationRulesController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create notification rule (accessible by OWNER, MANAGER)
router.post('/', authorize(['OWNER', 'MANAGER']), (req, res) => {
  const controller = new NotificationRulesController();
  controller.createRule(req, res);
});

// Get active rules for event type (accessible by all authenticated users)
router.get('/active', (req, res) => {
  const controller = new NotificationRulesController();
  controller.getActiveRules(req, res);
});

// Trigger notification event (accessible by OWNER, MANAGER)
router.post('/trigger', authorize(['OWNER', 'MANAGER']), (req, res) => {
  const controller = new NotificationRulesController();
  controller.triggerEvent(req, res);
});

// Get all rules for tenant (accessible by OWNER, MANAGER)
router.get('/', authorize(['OWNER', 'MANAGER']), (req, res) => {
  const controller = new NotificationRulesController();
  controller.getRules(req, res);
});

// Update rule (accessible by OWNER, MANAGER)
router.patch('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('NotificationRule'), (req, res) => {
  const controller = new NotificationRulesController();
  controller.updateRule(req, res);
});

// Delete rule (accessible by OWNER, MANAGER)
router.delete('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('NotificationRule'), (req, res) => {
  const controller = new NotificationRulesController();
  controller.deleteRule(req, res);
});

export default router;
