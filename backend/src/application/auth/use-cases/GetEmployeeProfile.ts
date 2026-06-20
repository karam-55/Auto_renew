import { IEmployeeRepository } from '../interfaces/IEmployeeRepository';
import { GetEmployeeProfileQuery } from '../queries/GetEmployeeProfileQuery';
import { EmployeeProfileDTO } from '../dto/EmployeeProfileDTO';

export class GetEmployeeProfile {
  constructor(private readonly employeeRepository: IEmployeeRepository) {}

  async execute(query: GetEmployeeProfileQuery): Promise<EmployeeProfileDTO> {
    const { employeeId } = query;

    const employee = await this.employeeRepository.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    return EmployeeProfileDTO.fromEntity(employee);
  }
}
