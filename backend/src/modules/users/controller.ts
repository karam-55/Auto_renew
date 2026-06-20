import { Request, Response } from 'express';
import { UserService } from './service';
import { AuthRequest } from '../../shared/middlewares/auth';
import { Logger } from '../../infrastructure/logging/logger';
import prisma from '../../config/database';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getAllUsers = async (req: AuthRequest, res: Response) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
      const skip = (page - 1) * limit;
      const [users, total] = await Promise.all([
        this.userService.getAllUsers(req.user!.tenantId, skip, limit),
        this.userService.getUsersCount(req.user!.tenantId),
      ]);
      res.json({
        data: users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      Logger.error('Get all users error', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  };

  getUserById = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(req.user!.tenantId, id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    } catch (error) {
      Logger.error('Get user error', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  };

  createUser = async (req: AuthRequest, res: Response) => {
    try {
      const user = await this.userService.createUser(req.user!.tenantId, req.body);
      res.status(201).json({ user });
    } catch (error: any) {
      Logger.error('Create user error', error);
      res.status(400).json({ error: error.message || 'Failed to create user' });
    }
  };

  updateUser = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const user = await this.userService.updateUser(req.user!.tenantId, id, req.body);
      res.json({ user });
    } catch (error: any) {
      Logger.error('Update user error', error);
      res.status(400).json({ error: error.message || 'Failed to update user' });
    }
  };

  deleteUser = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await this.userService.deleteUser(req.user!.tenantId, id);
      res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
      Logger.error('Delete user error', error);
      res.status(400).json({ error: error.message || 'Failed to delete user' });
    }
  };

  changePassword = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;
      await this.userService.changePassword(req.user!.tenantId, id, currentPassword, newPassword);
      res.json({ message: 'Password changed successfully' });
    } catch (error: any) {
      Logger.error('Change password error:', error);
      res.status(400).json({ error: error.message || 'Failed to change password' });
    }
  };

  // Batch create users
  createMany = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const { users } = req.body;

      if (!Array.isArray(users) || users.length === 0) {
        res.status(400).json({ error: 'Users array is required' });
        return;
      }

      const result = await prisma.$transaction(async (tx) => {
        const created = [];
        for (const user of users) {
          const u = await tx.user.create({
            data: {
              tenantId,
              username: user.username,
              passwordHash: user.password || 'default123',
              fullName: user.fullName || user.username,
              phone: user.phone || '',
              role: user.role || 'RECEPTIONIST',
              isActive: user.isActive !== undefined ? user.isActive : true,
            },
          });
          created.push(u);
        }
        return created;
      }, {
        timeout: 30000,
      });

      res.status(201).json({ count: result.length, users: result });
    } catch (error: any) {
      Logger.error('Batch create users error:', error);
      res.status(400).json({ error: error.message || 'Failed to create users' });
    }
  };
}
