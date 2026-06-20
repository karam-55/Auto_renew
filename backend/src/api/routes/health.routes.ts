import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';

const router = Router();
const healthController = new HealthController();

// Liveness probe - checks if the application is running
router.get('/live', (req, res) => healthController.live(req, res));

// Readiness probe - checks if the application is ready to accept traffic
router.get('/ready', (req, res) => healthController.ready(req, res));

// Detailed health check with system information
router.get('/', (req, res) => healthController.detailed(req, res));

export default router;
