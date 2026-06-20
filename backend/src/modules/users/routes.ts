import { Router } from 'express';
import { UserController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();
const userController = new UserController();

// All routes require authentication
router.use(authenticate);

// Get all users (accessible by OWNER, MANAGER)
router.get('/', authorize(['OWNER', 'MANAGER']), userController.getAllUsers);

// Get user by ID (accessible by OWNER, MANAGER)
router.get('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('User'), userController.getUserById);

// Create user (accessible by OWNER, MANAGER)
router.post('/', authorize(['OWNER', 'MANAGER']), userController.createUser);
router.post('/batch', authorize(['OWNER', 'MANAGER']), userController.createMany);

// Update user (accessible by OWNER, MANAGER)
router.put('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('User'), userController.updateUser);

// Delete user (accessible by OWNER)
router.delete('/:id', authorize(['OWNER']), tenantGuard('User'), userController.deleteUser);

// Change password (accessible by the user themselves or OWNER, MANAGER)
router.post('/:id/change-password', tenantGuard('User'), userController.changePassword);

export default router;
