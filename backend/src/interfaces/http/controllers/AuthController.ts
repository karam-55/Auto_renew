import { Request, Response } from 'express';
import { Logger } from '../../../infrastructure/logging/logger';
import { RegisterUser } from '../../../application/auth/use-cases/RegisterUser';
import { LoginUser } from '../../../application/auth/use-cases/LoginUser';
import { RefreshToken } from '../../../application/auth/use-cases/RefreshToken';
import { LogoutUser } from '../../../application/auth/use-cases/LogoutUser';
import { RegisterDto } from '../../../application/auth/dto/RegisterDto';
import { LoginDto } from '../../../application/auth/dto/LoginDto';
import { PrismaAuthRepository } from '../../../infrastructure/auth/repositories/PrismaAuthRepository';
import { JwtTokenService } from '../../../infrastructure/auth/services/JwtTokenService';
import { PasswordHasherService } from '../../../infrastructure/auth/services/PasswordHasherService';

export class AuthController {
  private registerUser: RegisterUser;
  private loginUser: LoginUser;
  private refreshToken: RefreshToken;
  private logoutUser: LogoutUser;

  constructor() {
    const authRepository = new PrismaAuthRepository();
    const tokenService = new JwtTokenService();
    const passwordHasher = new PasswordHasherService();

    this.registerUser = new RegisterUser(authRepository, passwordHasher, tokenService);
    this.loginUser = new LoginUser(authRepository, tokenService, passwordHasher);
    this.refreshToken = new RefreshToken(tokenService);
    this.logoutUser = new LogoutUser();
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, fullName, username, password, phone, role } = req.body;

      // Validation
      if (!tenantId || !fullName || !username || !password || !phone) {
        res.status(400).json({ error: 'Missing required fields: tenantId, fullName, username, password, phone' });
        return;
      }

      const result = await this.registerUser.execute(
        tenantId,
        fullName,
        username,
        password,
        phone,
        role
      );

      res.status(201).json({
        user: result.user,
        tokens: result.tokens,
      });
    } catch (error) {
      Logger.error('Register error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to register user';
      
      if (errorMessage === 'Tenant not found') {
        res.status(400).json({ error: 'Tenant not found' });
        return;
      }
      
      if (errorMessage === 'Username already exists') {
        res.status(400).json({ error: 'Username already exists' });
        return;
      }
      
      res.status(500).json({ error: 'Failed to register user', details: errorMessage });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password, tenantId } = req.body;

      const result = await this.loginUser.execute(username, password, tenantId);

      res.json({
        user: result.user,
        tokens: result.tokens,
      });
    } catch (error) {
      Logger.error('Login error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to login';
      
      if (errorMessage === 'Invalid credentials' || errorMessage === 'User account is inactive') {
        res.status(401).json({ error: errorMessage });
        return;
      }
      
      res.status(500).json({ error: 'Failed to login' });
    }
  }

  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({ error: 'Refresh token required' });
        return;
      }

      const result = await this.refreshToken.execute(refreshToken);

      res.json({ accessToken: result.accessToken });
    } catch (error) {
      Logger.error('Refresh token error:', error);
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    // In a real implementation, you would add the token to a blacklist
    // For now, we just return success (matching existing behavior)
    res.json({ message: 'Logged out successfully' });
  }
}
