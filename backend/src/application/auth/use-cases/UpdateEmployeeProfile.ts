import { IEmployeeRepository } from '../interfaces/IEmployeeRepository';
import { UpdateEmployeeProfileCommand } from '../commands/UpdateEmployeeProfileCommand';
import { EmployeeProfileDTO } from '../dto/EmployeeProfileDTO';

export class UpdateEmployeeProfile {
  constructor(private readonly employeeRepository: IEmployeeRepository) {}

  async execute(command: UpdateEmployeeProfileCommand): Promise<EmployeeProfileDTO> {
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

    // Check for duplicate phone (if phone is being changed)
    if (employee.phone !== dto.phone) {
      const existingEmployee = await this.employeeRepository.findByPhone(dto.phone);
      if (existingEmployee && existingEmployee.id !== employeeId) {
        throw new Error('Employee with this phone number already exists');
      }
    }

    // Update employee
    const updatedEmployee = {
      ...employee,
      name: dto.name,
      phone: dto.phone,
      updatedAt: new Date(),
    };

    const savedEmployee = await this.employeeRepository.update(updatedEmployee);

    return EmployeeProfileDTO.fromEntity(savedEmployee);
  }
}
