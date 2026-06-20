import { ChangeEmployeePasswordDTO } from '../dto/ChangeEmployeePasswordDTO';

export class ChangeEmployeePasswordCommand {
  constructor(
    public readonly employeeId: string,
    public readonly dto: ChangeEmployeePasswordDTO
  ) {}
}
