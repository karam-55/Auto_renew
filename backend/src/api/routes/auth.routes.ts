import { Router } from 'express';
import { AuthController } from '../controllers/auth/auth.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const authController = new AuthController();

router.post('/login', authController.login.bind(authController));
router.post('/logout', AuthMiddleware.authenticate, authController.logout.bind(authController));
router.post('/refresh', authController.refreshToken.bind(authController));
router.get('/profile', AuthMiddleware.authenticate, authController.getProfile.bind(authController));

export default router;
