import { Router } from 'express';
import { TenantController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';

const router = Router();
const tenantController = new TenantController();

// All routes require authentication and OWNER role
router.use(authenticate);
router.use(authorize(['OWNER']));

// Get all tenants
router.get('/', tenantController.getAllTenants);

// Get tenant stats
router.get('/stats/:id', tenantController.getTenantStats);

// Get tenant by ID
router.get('/:id', tenantController.getTenantById);

// Create tenant
router.post('/', tenantController.createTenant);

// Update tenant
router.put('/:id', tenantController.updateTenant);

// Delete tenant
router.delete('/:id', tenantController.deleteTenant);

export default router;
