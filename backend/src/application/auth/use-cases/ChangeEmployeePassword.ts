import { IEmployeeRepository } from '../interfaces/IEmployeeRepository';
import { IPasswordHasher } from '../interfaces/IPasswordHasher';
import { ChangeEmployeePasswordCommand } from '../commands/ChangeEmployeePasswordCommand';

export class ChangeEmployeePassword {
  constructor(
    private readonly employeeRepository: IEmployeeRepository,
    private readonly passwordHasher: IPasswordHasher
  ) {}

  async execute(command: ChangeEmployeePasswordCommand): Promise<void> {
    const { employeeId, dto } = command;

    // Validate DTO
    const validation = dto.validate();
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // Find employee
    const employee = await this.employeeRepository.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Verify old password
    const isOldPasswordValid = await this.passwordHasher.verify(dto.oldPassword, employee.password);
    if (!isOldPasswordValid) {
      throw new Error('Invalid old password');
    }

    // Hash new password
    const hashedNewPassword = await this.passwordHasher.hash(dto.newPassword);

    // Update employee password
    const updatedEmployee = {
      ...employee,
      password: hashedNewPassword,
      updatedAt: new Date(),
    };

    await this.employeeRepository.update(updatedEmployee);
  }
}
