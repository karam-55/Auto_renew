import { Router } from 'express';
import { DashboardController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';

const router = Router();
const dashboardController = new DashboardController();

// All routes require authentication
router.use(authenticate);

// Get dashboard KPIs (accessible by OWNER, MANAGER, RECEPTIONIST)
router.get('/kpis', authorize(['OWNER', 'MANAGER', 'RECEPTIONIST']), dashboardController.getKPIs);

export default router;
