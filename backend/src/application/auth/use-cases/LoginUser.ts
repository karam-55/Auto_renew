import { AuthRepository } from '../interfaces/AuthRepository';
import { TokenService } from '../interfaces/TokenService';
import { PasswordHasherService } from '../../../infrastructure/auth/services/PasswordHasherService';
import { JwtTokenService } from '../../../infrastructure/auth/services/JwtTokenService';
import { AuditService } from '../../../services/audit.service';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

export class LoginUser {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly tokenService: JwtTokenService,
    private readonly passwordHasher: PasswordHasherService
  ) {}

  async execute(
    username: string,
    password: string,
    tenantId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ user: any; tokens: any }> {
    // Find user by tenantId and username
    const result = await this.authRepository.findByUsernameAndTenantId(username, tenantId);

    if (!result) {
      throw new Error('Invalid credentials');
    }

    const { user, data } = result;

    // Check if account is locked
    if (data.lockedUntil && new Date(data.lockedUntil) > new Date()) {
      const lockoutRemaining = Math.ceil((new Date(data.lockedUntil).getTime() - Date.now()) / 60000);
      throw new Error(`Account locked. Try again in ${lockoutRemaining} minutes`);
    }

    // Verify password
    const isPasswordValid = await this.passwordHasher.compare(
      password,
      user.password.getValue()
    );

    if (!isPasswordValid) {
      // Increment failed login attempts
      const newFailedAttempts = (data.failedLoginAttempts || 0) + 1;
      const lockedUntil = newFailedAttempts >= MAX_FAILED_ATTEMPTS
        ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60000)
        : null;

      await this.authRepository.updateFailedLoginAttempts(data.id, newFailedAttempts, lockedUntil);

      // Log failed login attempt
      await AuditService.logAction({
        userId: data.id,
        action: 'LOGIN_FAILED',
        entity: 'User',
        entityId: data.id,
        ipAddress,
        userAgent,
      });

      if (lockedUntil) {
        throw new Error(`Account locked due to too many failed attempts. Try again in ${LOCKOUT_DURATION_MINUTES} minutes`);
      }

      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('User account is inactive');
    }

    // Reset failed login attempts on successful login
    await this.authRepository.updateFailedLoginAttempts(data.id, 0, null);

    // Log successful login
    await AuditService.logAction({
      userId: data.id,
      action: 'LOGIN_SUCCESS',
      entity: 'User',
      entityId: data.id,
      ipAddress,
      userAgent,
    });

    // Generate tokens
    const tokens = await this.tokenService.generateTokens({
      id: user.id,
      tenantId: user.tenantId,
      role: user.roles[0]?.name || 'RECEPTIONIST',
      username: user.username,
    });

    return {
      user: {
        id: data.id,
        tenantId: data.tenantId,
        fullName: data.fullName,
        username: data.username,
        role: data.role,
        phone: data.phone,
        isActive: data.isActive,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
      tokens,
    };
  }
}
