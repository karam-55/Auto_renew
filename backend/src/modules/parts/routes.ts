import { Router } from 'express';
import { PartController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { tenantGuard } from '../../middleware/tenant-guard.middleware';

const router = Router();
const partController = new PartController();

// All routes require authentication
router.use(authenticate);

// Create part (accessible by OWNER, MANAGER, SALES)
router.post('/', authorize(['OWNER', 'MANAGER', 'SALES']), partController.createPart);

// List parts with pagination (accessible by OWNER, MANAGER, RECEPTIONIST, SALES, MECHANIC)
router.get('/', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES', 'MECHANIC']), partController.getParts);

// Search parts (accessible by OWNER, MANAGER, RECEPTIONIST, SALES, MECHANIC)
router.get('/search', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES', 'MECHANIC']), partController.searchParts);

// Get low stock parts (accessible by OWNER, MANAGER, RECEPTIONIST, SALES)
router.get('/low-stock', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES']), partController.getLowStockParts);

// Get part by ID (accessible by OWNER, MANAGER, RECEPTIONIST, SALES, MECHANIC)
router.get('/:id', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES', 'MECHANIC']), tenantGuard('Part'), partController.getPartById);

// Update part (accessible by OWNER, MANAGER, SALES)
router.put('/:id', authorize(['OWNER', 'MANAGER', 'SALES']), tenantGuard('Part'), partController.updatePart);

// Delete part (accessible by OWNER, MANAGER)
router.delete('/:id', authorize(['OWNER', 'MANAGER']), tenantGuard('Part'), partController.deletePart);

// Update quantity (accessible by OWNER, MANAGER, SALES)
router.patch('/:id/quantity', authorize(['OWNER', 'MANAGER', 'SALES']), tenantGuard('Part'), partController.updateQuantity);

// Stock intake with package→unit conversion + last purchase price cost (OWNER, MANAGER)
router.post('/:id/stock-intake', authorize(['OWNER', 'MANAGER']), tenantGuard('Part'), partController.stockIntake);

export default router;
