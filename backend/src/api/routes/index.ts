import { Router } from 'express';
import authRoutes from './auth.routes';
import customerRoutes from './customers.routes';
import vehicleRoutes from './vehicles.routes';
import bookingRoutes from './bookings.routes';
import workOrderRoutes from './workorders.routes';
import invoiceRoutes from './invoices.routes';
import inventoryRoutes from './inventory.routes';
import accountingRoutes from './accounting.routes';
import publicRoutes from './public.routes';
import { queuesRouter } from './queues.routes';
import settingsRoutes from './settings.routes';
import notificationsRoutes from './notifications.routes';
import membershipRoutes from './membership.routes';
import branchRoutes from './branch.routes';
import analyticsRoutes from './analytics.routes';
import aiRoutes from './ai.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/bookings', bookingRoutes);
router.use('/workorders', workOrderRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/accounting', accountingRoutes);
router.use('/public', publicRoutes);
router.use('/queues', queuesRouter);
router.use('/settings', settingsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/memberships', membershipRoutes);
router.use('/branches', branchRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/ai', aiRoutes);

export default router;
