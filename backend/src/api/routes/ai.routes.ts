import { Router } from 'express';
import aiController from '../controllers/ai/ai.controller';
import { requirePermission } from '../../middleware/permission.middleware';

const router = Router();

// AI assistant routes require use_ai_assistant permission
router.use(requirePermission('use_ai_assistant'));

/**
 * @route   POST /api/ai/query
 * @desc    Process natural language query with AI
 * @access  Private (requires use_ai_assistant permission)
 * @body    query: string - Natural language query
 */
router.post('/query', aiController.processQuery.bind(aiController));

export default router;
