import { Router } from 'express';
import { RolesController } from '../controllers/rbac/roles.controller';
import { PermissionsController } from '../controllers/rbac/permissions.controller';
import { requirePermission } from '../../middleware/permission.middleware';
import { authenticate } from '../../shared/middlewares/auth';
import { auditContextMiddleware } from '../../middleware/audit.middleware';

const router = Router();
const rolesController = new RolesController();
const permissionsController = new PermissionsController();

// All routes require authentication
router.use(authenticate);

// Add audit context middleware after authentication
router.use(auditContextMiddleware);

// Permission middleware for role management
const manageRoles = requirePermission('manage_roles');

// Roles routes
router.get('/roles', manageRoles, (req, res) => rolesController.getAllRoles(req, res));
router.get('/roles/:id', manageRoles, (req, res) => rolesController.getRoleById(req, res));
router.post('/roles', manageRoles, (req, res) => rolesController.createRole(req, res));
router.post('/roles/batch', manageRoles, (req, res) => rolesController.createManyRoles(req, res));
router.put('/roles/:id', manageRoles, (req, res) => rolesController.updateRole(req, res));
router.delete('/roles/:id', manageRoles, (req, res) => rolesController.deleteRole(req, res));

// Permissions routes
router.get('/permissions', manageRoles, (req, res) => permissionsController.getAllPermissions(req, res));
router.get('/roles/:roleId/permissions', manageRoles, (req, res) => permissionsController.getRolePermissions(req, res));
router.post('/roles/:roleId/permissions', manageRoles, (req, res) => permissionsController.assignPermissionsToRole(req, res));

export default router;
