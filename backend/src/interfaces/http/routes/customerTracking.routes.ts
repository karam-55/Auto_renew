import { Router } from 'express';
import { CustomerTrackingController } from '../controllers/customerTracking.controller';

const router = Router();
const controller = new CustomerTrackingController();

router.get('/track/:public_token', controller.getTrackingInfo.bind(controller));

export default router;
