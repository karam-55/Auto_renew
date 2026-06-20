import { Router } from 'express';
import { CustomerController } from '../controllers/customers/customer.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const customerController = new CustomerController();

router.post('/', AuthMiddleware.authenticate, customerController.create.bind(customerController));
router.get('/:id', customerController.findById.bind(customerController));
router.get('/', AuthMiddleware.authenticate, customerController.list.bind(customerController));
router.put('/:id', customerController.update.bind(customerController));
router.delete('/:id', customerController.delete.bind(customerController));
router.post('/:id/loyalty', customerController.addLoyaltyPoints.bind(customerController));

export default router;
