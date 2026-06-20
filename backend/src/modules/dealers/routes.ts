import { Router } from 'express';
import { DealerController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';

const router = Router();
const dealerController = new DealerController();

router.use(authenticate);

router.get('/', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES']), dealerController.getDealers);
router.get('/search', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES']), dealerController.searchDealers);
router.get('/:id', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST', 'SALES']), dealerController.getDealerById);
router.post('/', authorize(['OWNER', 'MANAGER']), dealerController.createDealer);
router.put('/:id', authorize(['OWNER', 'MANAGER']), dealerController.updateDealer);
router.delete('/:id', authorize(['OWNER', 'MANAGER']), dealerController.deleteDealer);

export default router;
