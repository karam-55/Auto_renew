import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { requirePermission } from '../../middleware/permission.middleware';
import { authenticate } from '../../shared/middlewares/auth';
import { auditContextMiddleware } from '../../middleware/audit.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Add audit context middleware after authentication
router.use(auditContextMiddleware);

// All audit log routes require view_audit_logs permission
router.use(requirePermission('view_audit_logs'));

/**
 * @route   GET /api/audit
 * @desc    Get audit logs with filtering and pagination
 * @access  Private (requires view_audit_logs permission)
 */
router.get('/', AuditController.getAuditLogs);

/**
 * @route   GET /api/audit/:id
 * @desc    Get a single audit log by ID
 * @access  Private (requires view_audit_logs permission)
 */
router.get('/:id', AuditController.getAuditLogById);

export default router;
