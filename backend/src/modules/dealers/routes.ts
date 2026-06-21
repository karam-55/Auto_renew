import { Router } from 'express';
import { DealerController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { dealerAuth } from './middleware';

const router = Router();
const dealerController = new DealerController();

// Public dealer auth routes
router.post('/register', dealerController.register);
router.post('/login', dealerController.login);

// Protected dealer routes (admin auth)
router.get('/', authenticate, authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES']), dealerController.getDealers);
router.get('/search', authenticate, authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES']), dealerController.searchDealers);
router.get('/:id/warranties', authenticate, authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES']), dealerController.getDealerWarranties);
router.get('/:id', authenticate, authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES']), dealerController.getDealerById);
router.post('/', authenticate, authorize(['OWNER', 'MANAGER']), dealerController.createDealer);
router.put('/:id', authenticate, authorize(['OWNER', 'MANAGER']), dealerController.updateDealer);
router.delete('/:id', authenticate, authorize(['OWNER', 'MANAGER']), dealerController.deleteDealer);

// Dealer app routes (dealer auth)
router.get('/me/stats', dealerAuth, dealerController.getDealerStats);
router.get('/me/warranties', dealerAuth, dealerController.getMyWarranties);
router.get('/me/warranties/:id', dealerAuth, dealerController.getWarrantyById);
router.post('/me/warranties', dealerAuth, dealerController.createWarranty);

export default router;
