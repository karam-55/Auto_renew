import { Router } from 'express';
import { PublicController } from './controller';

const router = Router();
const controller = new PublicController();

// NO AUTHENTICATION REQUIRED - Public endpoints for customer tracking

// Validate public token
router.get('/validate/:publicToken', (req, res) => {
  controller.validatePublicToken(req, res);
});

// Get booking details by public token
router.get('/booking/:publicToken', (req, res) => {
  controller.getBookingByPublicToken(req, res);
});

export default router;
