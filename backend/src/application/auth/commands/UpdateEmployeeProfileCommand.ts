import { UpdateEmployeeProfileDTO } from '../dto/UpdateEmployeeProfileDTO';

export class UpdateEmployeeProfileCommand {
  constructor(
    public readonly employeeId: string,
    public readonly dto: UpdateEmployeeProfileDTO
  ) {}
}
