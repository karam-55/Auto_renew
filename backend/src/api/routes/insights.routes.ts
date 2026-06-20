import { Router } from 'express';
import { InsightsController } from '../controllers/insights/insights.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const insightsController = new InsightsController();

router.get('/insights', AuthMiddleware.authenticate, insightsController.getInsights.bind(insightsController));

export default router;
