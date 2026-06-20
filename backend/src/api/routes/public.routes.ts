import { Router } from 'express';
import { TrackingController } from '../controllers/public/tracking.controller';

const router = Router();
const trackingController = new TrackingController();

router.get('/tracking/:publicToken', trackingController.getByPublicToken.bind(trackingController));

export default router;
