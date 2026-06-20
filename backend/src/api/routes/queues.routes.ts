import { Router } from 'express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { QueueConfig, QueueNames } from '../../queues/queue.config';
import { AuthMiddleware, UserRole } from '../middlewares/auth.middleware';

/**
 * Queues Routes
 * Bull Board dashboard for monitoring queues
 */
export const queuesRouter = Router();

/**
 * Setup Bull Board
 */
const setupBullBoard = () => {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  const queues = [
    new BullMQAdapter(QueueConfig.createQueue(QueueNames.NOTIFICATIONS), { readOnlyMode: false }),
    new BullMQAdapter(QueueConfig.createQueue(QueueNames.PDF), { readOnlyMode: false }),
    new BullMQAdapter(QueueConfig.createQueue(QueueNames.REPORTS), { readOnlyMode: false }),
    new BullMQAdapter(QueueConfig.createQueue(QueueNames.ACCOUNTING), { readOnlyMode: false }),
    new BullMQAdapter(QueueConfig.createQueue(QueueNames.INVENTORY), { readOnlyMode: false }),
  ];

  createBullBoard({
    queues,
    serverAdapter,
  });

  return serverAdapter;
};

/**
 * GET /admin/queues
 * Bull Board dashboard - requires ADMIN role
 */
queuesRouter.get(
  '/admin/queues',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(UserRole.ADMIN),
  (req, res, next) => {
    const serverAdapter = setupBullBoard();
    return serverAdapter.getRouter()(req, res, next);
  }
);

/**
 * GET /api/queues/stats
 * Get queue statistics - requires ADMIN or MANAGER role
 */
queuesRouter.get(
  '/stats',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (req, res, next) => {
    try {
      const { QueueService } = await import('../../queues/queue.service');
      const stats = await QueueService.getAllQueueStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
);
