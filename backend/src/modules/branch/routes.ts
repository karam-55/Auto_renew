import { Router } from 'express';
import { BranchController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();
const branchController = new BranchController();

// All routes require authentication
router.use(authenticate);

// GET /api/branches - Get all branches
router.get('/', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES']), branchController.getBranches);

// GET /api/branches/:id - Get branch by ID
router.get('/:id', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES']), tenantGuard('Branch'), branchController.getBranchById);

// POST /api/branches - Create new branch
router.post('/', authorize(['OWNER', 'MANAGER']), branchController.createBranch);

// PUT /api/branches/:id - Update branch
router.put('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('Branch'), branchController.updateBranch);

// DELETE /api/branches/:id - Delete branch
router.delete('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('Branch'), branchController.deleteBranch);

// POST /api/branches/:id/activate - Activate branch
router.post('/:id/activate', authorize(['OWNER', 'MANAGER']), tenantGuard('Branch'), branchController.activateBranch);

// POST /api/branches/:id/deactivate - Deactivate branch
router.post('/:id/deactivate', authorize(['OWNER', 'MANAGER']), tenantGuard('Branch'), branchController.deactivateBranch);

export default router;
