import { IEmployeeRepository } from '../interfaces/IEmployeeRepository';
import { IPasswordHasher } from '../interfaces/IPasswordHasher';
import { RegisterEmployeeCommand } from '../commands/RegisterEmployeeCommand';
import { EmployeeProfileDTO } from '../dto/EmployeeProfileDTO';
import { v4 as uuidv4 } from 'uuid';

export class RegisterEmployee {
  constructor(
    private readonly employeeRepository: IEmployeeRepository,
    private readonly passwordHasher: IPasswordHasher
  ) {}

  async execute(command: RegisterEmployeeCommand): Promise<EmployeeProfileDTO> {
    const { dto } = command;

    // Validate DTO
    const validation = dto.validate();
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // Check for duplicate phone
    const existingEmployee = await this.employeeRepository.findByPhone(dto.phone);
    if (existingEmployee) {
      throw new Error('Employee with this phone number already exists');
    }

    // Hash password
    const hashedPassword = await this.passwordHasher.hash(dto.password);

    // Create employee
    const employee = {
      id: uuidv4(),
      name: dto.name,
      phone: dto.phone,
      password: hashedPassword,
      role: dto.role.toUpperCase(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save employee
    const savedEmployee = await this.employeeRepository.save(employee);

    return EmployeeProfileDTO.fromEntity(savedEmployee);
  }
}
