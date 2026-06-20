import { AuthRepository } from '../interfaces/AuthRepository';
import { User } from '../../../domain/auth/entities/User';
import { Password } from '../../../domain/auth/value-objects/Password';
import { UserCreatedEvent } from '../../../domain/auth/events/UserCreatedEvent';
import { PasswordHasherService } from '../../../infrastructure/auth/services/PasswordHasherService';
import { JwtTokenService } from '../../../infrastructure/auth/services/JwtTokenService';
import { v4 as uuidv4 } from 'uuid';

export class RegisterUser {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly passwordHasher: PasswordHasherService,
    private readonly tokenService: JwtTokenService
  ) {}

  async execute(
    tenantId: string,
    fullName: string,
    username: string,
    password: string,
    phone: string,
    role?: string
  ): Promise<{ user: any; tokens: any; event: UserCreatedEvent }> {
    // Check if tenant exists
    const tenantExists = await this.authRepository.tenantExists(tenantId);
    if (!tenantExists) {
      throw new Error('Tenant not found');
    }

    // Check if user already exists
    const existingUser = await this.authRepository.findByUsernameAndTenantId(username, tenantId);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Hash password
    const hashedPassword = await this.passwordHasher.hash(password);
    const passwordValueObject = new Password(hashedPassword);

    // Create user entity
    const userId = uuidv4();
    const user = User.create(
      userId,
      passwordValueObject,
      username,
      tenantId
    );

    // Save user to database
    const createdUser = await this.authRepository.create(
      user,
      fullName,
      phone,
      role || 'RECEPTIONIST'
    );

    // Generate tokens
    const tokens = await this.tokenService.generateTokens({
      id: createdUser.id,
      tenantId: createdUser.tenantId,
      role: createdUser.role,
      username: createdUser.username,
    });

    // Create event
    const event = new UserCreatedEvent(user);

    return {
      user: {
        id: createdUser.id,
        tenantId: createdUser.tenantId,
        fullName: createdUser.fullName,
        username: createdUser.username,
        role: createdUser.role,
        phone: createdUser.phone,
        isActive: createdUser.isActive,
        createdAt: createdUser.createdAt,
        updatedAt: createdUser.updatedAt,
      },
      tokens,
      event,
    };
  }
}
