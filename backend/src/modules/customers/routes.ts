import { Router } from 'express';
import { CustomerController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { auditContextMiddleware } from '../../middleware/audit.middleware';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';
import { ValidationMiddleware } from '../../api/middlewares/validation.middleware';
import { createCustomerSchema, updateCustomerSchema, addLoyaltyPointsSchema } from './validation';

const router = Router();
const customerController = new CustomerController();

// All routes require authentication
router.use(authenticate);

// Add audit context middleware after authentication
router.use(auditContextMiddleware);

// Get all customers (accessible by OWNER, MANAGER, RECEPTIONIST, SALES)
router.get('/', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES']), customerController.getAllCustomers);

// Search customers (accessible by OWNER, MANAGER, RECEPTIONIST, SALES)
router.get('/search', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES']), customerController.searchCustomers);

// Get customer by ID (accessible by OWNER, MANAGER, RECEPTIONIST, SALES)
router.get('/:id', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES']), tenantGuard('Customer'), customerController.getCustomerById);

// Create customer (accessible by OWNER, MANAGER, RECEPTIONIST, SALES)
router.post('/', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES']), ValidationMiddleware.validate(createCustomerSchema), customerController.createCustomer);

// Update customer (accessible by OWNER, MANAGER, RECEPTIONIST, SALES)
router.put('/:id', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES']), tenantGuard('Customer'), ValidationMiddleware.validate(updateCustomerSchema), customerController.updateCustomer);

// Delete customer (accessible by OWNER, MANAGER)
router.delete('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('Customer'), customerController.deleteCustomer);

// Add loyalty points (accessible by OWNER, MANAGER)
router.post('/:id/loyalty-points', authorize(['OWNER', 'MANAGER']), tenantGuard('Customer'), ValidationMiddleware.validate(addLoyaltyPointsSchema), customerController.addLoyaltyPoints);

export default router;
