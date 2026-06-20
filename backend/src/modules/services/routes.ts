import { Router } from 'express';
import { ServiceController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();
const serviceController = new ServiceController();

// All routes require authentication
router.use(authenticate);

// Get all services (accessible by all authenticated users)
router.get('/', serviceController.getAllServices);

// Search services (accessible by all authenticated users)
router.get('/search', serviceController.searchServices);

// Get services by category (accessible by all authenticated users)
router.get('/category/:category', serviceController.getServicesByCategory);

// Get service by ID (accessible by all authenticated users)
router.get('/:id', tenantGuard('Service'), serviceController.getServiceById);

// Create service (accessible by OWNER, MANAGER)
router.post('/', authorize(['OWNER', 'MANAGER']), serviceController.createService);
router.post('/batch', authorize(['OWNER', 'MANAGER']), serviceController.createMany);

// Update service (accessible by OWNER, MANAGER)
router.put('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('Service'), serviceController.updateService);

// Delete service (accessible by OWNER)
router.delete('/:id', authorize(['OWNER']), tenantGuard('Service'), serviceController.deleteService);

// Service Parts routes
router.get('/:id/parts', tenantGuard('Service'), serviceController.getServiceParts);
router.post('/:id/parts', authorize(['OWNER', 'MANAGER']), tenantGuard('Service'), serviceController.addServicePart);
router.delete('/:id/parts/:partId', authorize(['OWNER', 'MANAGER']), tenantGuard('Service'), serviceController.removeServicePart);

export default router;
