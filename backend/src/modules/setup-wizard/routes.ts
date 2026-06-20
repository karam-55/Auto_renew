import { Router } from 'express';
import { authenticate, authorize } from '../../shared/middlewares/auth';
import { setupWizardController } from './controller';

const router = Router();

// All setup-wizard routes are public (no auth required)
router.get('/needs-init', setupWizardController.needsInit);
router.post('/init', setupWizardController.init);
router.get('/status', setupWizardController.getStatus);
router.post('/step/1', setupWizardController.saveStep1);
router.post('/step/2', setupWizardController.saveStep2);
router.post('/step/3', setupWizardController.saveStep3);
router.post('/step/4', setupWizardController.saveStep4);
router.post('/step/5', setupWizardController.saveStep5);
router.post('/step/6', setupWizardController.saveStep6);
router.post('/complete', setupWizardController.complete);

export default router;
