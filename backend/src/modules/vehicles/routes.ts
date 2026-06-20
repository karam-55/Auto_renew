import { Router } from 'express';
import { Logger } from '../../infrastructure/logging/logger';
import { VehicleController } from './controller';
import { VehicleController as VehicleManagementController } from './vehicle.controller';
import { VehicleAnalyticsController } from './analytics.controller';
import { VehicleCategoryController } from './vehicle-category.controller';
import { VehicleAttachmentController } from './vehicle-attachment.controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const vehicleController = new VehicleController();
const vehicleManagementController = new VehicleManagementController();
const analyticsController = new VehicleAnalyticsController();
const vehicleCategoryController = new VehicleCategoryController();
const vehicleAttachmentController = new VehicleAttachmentController();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
    }
  },
});

// All routes require authentication
router.use(authenticate);

// Vehicle Categories Routes
router.get('/categories', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST']), vehicleCategoryController.getAllCategories.bind(vehicleCategoryController));
router.get('/categories/:id', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST']), vehicleCategoryController.getCategoryById.bind(vehicleCategoryController));
router.post('/categories', authorize(['OWNER', 'MANAGER']), vehicleCategoryController.createCategory.bind(vehicleCategoryController));
router.put('/categories/:id', authorize(['OWNER', 'MANAGER']), vehicleCategoryController.updateCategory.bind(vehicleCategoryController));
router.delete('/categories/:id', authorize(['OWNER', 'MANAGER']), vehicleCategoryController.deleteCategory.bind(vehicleCategoryController));

// Get all vehicles (accessible by OWNER, MANAGER, RECEPTIONIST, MECHANIC, SALES)
router.get('/', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'MECHANIC', 'SALES']), vehicleController.getAllVehicles.bind(vehicleController));

// Search vehicles (accessible by OWNER, MANAGER, RECEPTIONIST, MECHANIC, SALES)
router.get('/search', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'MECHANIC', 'SALES']), vehicleController.searchVehicles.bind(vehicleController));

// Get vehicles by customer (accessible by OWNER, MANAGER, RECEPTIONIST, SALES)
router.get('/customer/:customerId', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES']), vehicleController.getVehiclesByCustomer.bind(vehicleController));

// Get vehicle history (accessible by OWNER, MANAGER, RECEPTIONIST, MECHANIC) - MUST BE BEFORE /:id
router.get('/:id/history', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'MECHANIC']), tenantGuard('Vehicle'), vehicleController.getVehicleHistory.bind(vehicleController));

// Get vehicle by ID (accessible by OWNER, MANAGER, RECEPTIONIST, MECHANIC, SALES)
router.get('/:id', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'MECHANIC', 'SALES']), tenantGuard('Vehicle'), vehicleController.getVehicleById.bind(vehicleController));

// Create vehicle (accessible by OWNER, MANAGER, RECEPTIONIST, SALES)
router.post('/', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES']), vehicleController.createVehicle.bind(vehicleController));

// Update vehicle (accessible by OWNER, MANAGER, RECEPTIONIST, SALES)
router.put('/:id', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES']), tenantGuard('Vehicle'), (req, res, next) => {
  Logger.debug('=== MODULES VEHICLES UPDATE ROUTE CALLED ===');
  Logger.debug('Vehicle update route', { vehicleId: req.params.id, body: req.body });
  next();
}, vehicleController.updateVehicle.bind(vehicleController));

// Update mileage (accessible by OWNER, MANAGER, RECEPTIONIST, MECHANIC)
router.patch('/:id/mileage', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'MECHANIC']), tenantGuard('Vehicle'), vehicleController.updateMileage.bind(vehicleController));

// Delete vehicle (accessible by OWNER, MANAGER)
router.delete('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('Vehicle'), vehicleController.deleteVehicle.bind(vehicleController));

// Phase H: Vehicle Management Routes

// Vehicle Faults
router.get('/:id/faults', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'MECHANIC']), tenantGuard('Vehicle'), vehicleManagementController.getVehicleFaults.bind(vehicleManagementController));
router.post('/:id/faults', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'MECHANIC']), tenantGuard('Vehicle'), vehicleManagementController.createVehicleFault.bind(vehicleManagementController));
router.put('/faults/:faultId', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'MECHANIC']), tenantGuard('VehicleIssue'), vehicleManagementController.updateVehicleFault.bind(vehicleManagementController));
router.delete('/faults/:faultId', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'MECHANIC']), tenantGuard('VehicleIssue'), vehicleManagementController.deleteVehicleFault.bind(vehicleManagementController));
router.put('/faults/:faultId/resolve', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'MECHANIC']), tenantGuard('VehicleIssue'), vehicleManagementController.resolveVehicleFault.bind(vehicleManagementController));

// Vehicle Attachments
router.get('/:id/attachments', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'MECHANIC']), tenantGuard('Vehicle'), vehicleManagementController.getVehicleAttachments.bind(vehicleManagementController));
router.post('/:id/attachments', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'MECHANIC']), tenantGuard('Vehicle'), vehicleManagementController.createVehicleAttachment.bind(vehicleManagementController));
router.delete('/attachments/:attachmentId', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'MECHANIC']), tenantGuard('VehicleAttachment'), vehicleAttachmentController.deleteVehicleAttachment.bind(vehicleAttachmentController));

// Vehicle Recommendations
router.get('/:id/recommendations', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'MECHANIC']), tenantGuard('Vehicle'), vehicleManagementController.getVehicleRecommendations.bind(vehicleManagementController));
router.post('/:id/recommendations', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'MECHANIC']), tenantGuard('Vehicle'), vehicleManagementController.createVehicleRecommendation.bind(vehicleManagementController));
router.put('/recommendations/:recId', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'MECHANIC']), tenantGuard('VehicleRecommendation'), vehicleManagementController.updateVehicleRecommendation.bind(vehicleManagementController));
router.delete('/recommendations/:recId', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'MECHANIC']), tenantGuard('VehicleRecommendation'), vehicleManagementController.deleteVehicleRecommendation.bind(vehicleManagementController));
router.put('/recommendations/:recId/complete', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'MECHANIC']), tenantGuard('VehicleRecommendation'), vehicleManagementController.completeVehicleRecommendation.bind(vehicleManagementController));

// Update vehicle mileage (Phase H version)
router.patch('/:id/mileage-update', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'MECHANIC']), tenantGuard('Vehicle'), vehicleManagementController.updateVehicleMileage.bind(vehicleManagementController));

// Vehicle Analytics
router.get('/analytics/stats', authorize(['OWNER', 'MANAGER']), analyticsController.getVehicleStats.bind(analyticsController));
router.get('/analytics/history-stats', authorize(['OWNER', 'MANAGER']), analyticsController.getVehicleHistoryStats.bind(analyticsController));

export default router;
