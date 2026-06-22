import { Router } from 'express';
import { DealerController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { dealerAuth } from './middleware';

const router = Router();
const dealerController = new DealerController();

// Public dealer auth routes - MUST be before any parameterized routes
router.post('/register', (req, res, next) => {
  console.log('[DEALERS] POST /register hit - body:', JSON.stringify(req.body));
  console.log('[DEALERS] POST /register - headers:', JSON.stringify(req.headers));
  next();
}, dealerController.register);
router.post('/login', (req, res, next) => {
  console.log('[DEALERS] POST /login hit');
  next();
}, dealerController.login);

// Dealer app routes (dealer auth) - MUST be before /:id parameterized routes
router.get('/me/stats', dealerAuth, dealerController.getDealerStats);
router.get('/me/warranties', dealerAuth, dealerController.getMyWarranties);
router.get('/me/warranties/:id', dealerAuth, dealerController.getWarrantyById);
router.get('/me/warranties/:id/pdf', dealerAuth, dealerController.downloadWarrantyPdf);
router.post('/me/warranties', dealerAuth, dealerController.createWarranty);
router.put('/me/warranties/:id', dealerAuth, dealerController.updateWarranty);
router.delete('/me/warranties/:id', dealerAuth, dealerController.deleteWarranty);

// Protected dealer routes (admin auth)
router.get('/', authenticate, authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES']), dealerController.getDealers);
router.get('/search', authenticate, authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES']), dealerController.searchDealers);
router.get('/:id/warranties', authenticate, authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES']), dealerController.getDealerWarranties);
router.get('/:id/stats', authenticate, authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES']), dealerController.getDealerStatsAdmin);
router.get('/:id', authenticate, authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES']), dealerController.getDealerById);
router.post('/', authenticate, authorize(['OWNER', 'MANAGER']), dealerController.createDealer);
router.put('/:id', authenticate, authorize(['OWNER', 'MANAGER']), dealerController.updateDealer);
router.delete('/:id', authenticate, authorize(['OWNER', 'MANAGER']), dealerController.deleteDealer);

export default router;
