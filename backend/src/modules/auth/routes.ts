import { Router, Request, Response } from 'express';
import { Logger } from '../../infrastructure/logging/logger';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database';
import { hashPassword, generateTokens, comparePassword } from '../../shared/utils/auth';
import { authenticate, AuthRequest } from '../../shared/middlewares/auth';
import { AuditService } from '../../services/audit.service';
import { ValidationMiddleware } from '../../api/middlewares/validation.middleware';
import { authLimiter } from '../../middleware/security.middleware';

const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', authLimiter, ValidationMiddleware.validate(ValidationMiddleware.schemas.register), async (req: Request, res: Response) => {
  try {
    const { tenantId, fullName, username, password, phone, role } = req.body;

    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return res.status(400).json({ error: 'Tenant not found' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        tenantId,
        username,
        deletedAt: null,
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        tenantId,
        fullName,
        username,
        passwordHash,
        phone,
        role: role || 'RECEPTIONIST',
      },
    });

    // Generate tokens
    const tokens = generateTokens({
      id: user.id,
      tenantId: user.tenantId,
      role: user.role,
      username: user.username,
    });

    res.status(201).json({
      user: {
        id: user.id,
        tenantId: user.tenantId,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      tokens,
    });
  } catch (error: any) {
    Logger.error('Register error:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Invalid tenant ID' });
    }
    
    res.status(500).json({ error: 'Failed to register user', details: error.message });
  }
});

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', authLimiter, ValidationMiddleware.validate(ValidationMiddleware.schemas.login), async (req: Request, res: Response) => {
  try {
    const { username, password, tenantId } = req.body;
    const ipAddress = AuditService.extractIpAddress(req);
    const userAgent = AuditService.extractUserAgent(req);

    // Find user — if tenantId is 'default', search across all tenants by username only
    const user = tenantId && tenantId !== 'default'
      ? await prisma.user.findFirst({ where: { tenantId, username } })
      : await prisma.user.findFirst({ where: { username } });

    if (!user) {
      // Log failed login attempt
      await AuditService.logAction({
        action: 'LOGIN_FAILED',
        entity: 'User',
        entityId: '',
        before: null,
        after: { usernameAttempted: username, tenantId },
        ipAddress,
        userAgent,
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await comparePassword(password, user.passwordHash);

    if (!isValidPassword) {
      // Log failed login attempt
      await AuditService.logAction({
        action: 'LOGIN_FAILED',
        entity: 'User',
        entityId: user.id,
        before: null,
        after: { usernameAttempted: username },
        ipAddress,
        userAgent,
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ error: 'User account is inactive' });
    }

    // Generate tokens
    const tokens = generateTokens({
      id: user.id,
      tenantId: user.tenantId,
      role: user.role,
      username: user.username,
    });

    // Log successful login
    await AuditService.logAction({
      action: 'LOGIN_SUCCESS',
      entity: 'User',
      entityId: user.id,
      before: null,
      after: { username, tenantId: user.tenantId, role: user.role },
      ipAddress,
      userAgent,
    });

    res.json({
      user: {
        id: user.id,
        tenantId: user.tenantId,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      tokens,
    });
  } catch (error: any) {
    Logger.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login', details: error?.message || String(error) });
  }
});

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh', ValidationMiddleware.validate(ValidationMiddleware.schemas.refreshToken), async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    const payload = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!
    ) as {
      id: string;
      tenantId: string;
      role: string;
      username: string;
    };

    // Generate new access token (create new payload without exp)
    const accessToken = jwt.sign(
      {
        id: payload.id,
        tenantId: payload.tenantId,
        role: payload.role,
        username: payload.username,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: '100y',
      }
    );

    res.json({ accessToken });
  } catch (error) {
    Logger.error('Refresh token error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

/**
 * @route GET /api/auth/me
 * @desc Get current user
 * @access Private
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        fullName: true,
        username: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    Logger.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Private
 */
router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  // In a real implementation, you would add the token to a blacklist
  // For now, we just return success
  res.json({ message: 'Logged out successfully' });
});

export default router;
