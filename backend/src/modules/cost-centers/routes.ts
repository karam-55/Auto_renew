import { Router } from 'express';
import { costCenterController } from './controller';
import { authenticate, authorize } from '../../shared/middlewares/auth';

const router = Router();

router.use(authenticate);

// Initialize default cost centers
router.post('/initialize', authorize(['OWNER', 'MANAGER']), costCenterController.initializeDefaults);

// Cost Centers CRUD
router.get('/', costCenterController.getAll);
router.post('/', authorize(['OWNER', 'MANAGER']), costCenterController.create);

// Allocations (must be before /:id)
router.get('/allocations/all', costCenterController.getAllocations);
router.post('/allocations', authorize(['OWNER', 'MANAGER']), costCenterController.createAllocation);
router.put('/allocations/:id', authorize(['OWNER', 'MANAGER']), costCenterController.updateAllocation);
router.delete('/allocations/:id', authorize(['OWNER']), costCenterController.deleteAllocation);

// Overhead Rates (must be before /:id)
router.get('/overhead-rates/all', costCenterController.getOverheadRates);

// Service Cost Breakdown (must be before /:id)
router.post('/service-cost', costCenterController.calculateServiceCost);
router.get('/service-cost/:serviceId', costCenterController.getServiceCostDetails);
router.post('/service-cost/:serviceId', authorize(['OWNER', 'MANAGER']), costCenterController.saveServiceCostDetails);

// Individual resource routes LAST
router.get('/:id', costCenterController.getById);
router.put('/:id', authorize(['OWNER', 'MANAGER']), costCenterController.update);
router.delete('/:id', authorize(['OWNER']), costCenterController.delete);

export default router;
