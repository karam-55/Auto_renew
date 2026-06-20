import { Router } from 'express';
import { DepreciationController } from './depreciation.controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';

const router = Router();
const controller = new DepreciationController();

// All routes require authentication
router.use(authenticate);

// Run depreciation for current tenant (OWNER, MANAGER)
router.post('/run', authorize(['OWNER', 'MANAGER']), (req, res) => {
  controller.runDepreciation(req, res);
});

// Run depreciation for all tenants (OWNER only)
router.post('/run-all', authorize(['OWNER']), (req, res) => {
  controller.runAllDepreciation(req, res);
});

export default router;
