import { IEmployeeRepository } from '../interfaces/IEmployeeRepository';
import { IPasswordHasher } from '../interfaces/IPasswordHasher';
import { ITokenService } from '../interfaces/ITokenService';
import { LoginEmployeeCommand } from '../commands/LoginEmployeeCommand';
import { EmployeeProfileDTO } from '../dto/EmployeeProfileDTO';
import { AuditService } from '../../../services/audit.service';
import prisma from '../../../config/database';

export class LoginEmployee {
  constructor(
    private readonly employeeRepository: IEmployeeRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService
  ) {}

  async execute(command: LoginEmployeeCommand): Promise<{ employee: EmployeeProfileDTO; token: string }> {
    const { dto, ipAddress, userAgent } = command;

    // Validate DTO
    const validation = dto.validate();
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // Find employee by phone
    const employee = await this.employeeRepository.findByPhone(dto.phone);
    if (!employee) {
      // Log failed login attempt
      await AuditService.logAction({
        action: 'LOGIN_FAILED',
        entity: 'Employee',
        entityId: '',
        before: null,
        after: { phoneAttempted: dto.phone },
        ipAddress,
        userAgent,
      });
      throw new Error('Invalid phone or password');
    }

    // Verify password
    const isPasswordValid = await this.passwordHasher.verify(dto.password, employee.password);
    if (!isPasswordValid) {
      // Log failed login attempt
      await AuditService.logAction({
        action: 'LOGIN_FAILED',
        entity: 'Employee',
        entityId: employee.id,
        before: null,
        after: { phoneAttempted: dto.phone },
        ipAddress,
        userAgent,
      });
      throw new Error('Invalid phone or password');
    }

    // Generate token
    const token = await this.tokenService.generateToken(employee.id, employee.role);

    // Update employee login info
    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    // Log successful login
    await AuditService.logAction({
      action: 'LOGIN_SUCCESS',
      entity: 'Employee',
      entityId: employee.id,
      before: null,
      after: { lastLoginAt: new Date(), lastLoginIp: ipAddress },
      ipAddress,
      userAgent,
    });

    return {
      employee: EmployeeProfileDTO.fromEntity(employee),
      token,
    };
  }
}
