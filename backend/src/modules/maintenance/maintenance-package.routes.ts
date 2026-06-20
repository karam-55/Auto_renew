import { Router } from 'express';
import { MaintenancePackageController } from './maintenance-package.controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();
const maintenancePackageController = new MaintenancePackageController();

// All routes require authentication
router.use(authenticate);

// Get all maintenance packages
router.get('/', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST']), maintenancePackageController.getAllPackages.bind(maintenancePackageController));

// Get package by ID
router.get('/:id', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST']), tenantGuard('MaintenancePackage'), maintenancePackageController.getPackageById.bind(maintenancePackageController));

// Create package
router.post('/', authorize(['OWNER', 'MANAGER']), maintenancePackageController.createPackage.bind(maintenancePackageController));

// Update package
router.put('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('MaintenancePackage'), maintenancePackageController.updatePackage.bind(maintenancePackageController));

// Delete package
router.delete('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('MaintenancePackage'), maintenancePackageController.deletePackage.bind(maintenancePackageController));

export default router;
