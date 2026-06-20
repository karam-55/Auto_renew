import { UpdateEmployeeProfile } from '../use-cases/UpdateEmployeeProfile';
import { UpdateEmployeeProfileCommand } from '../commands/UpdateEmployeeProfileCommand';

export class UpdateEmployeeProfileHandler {
  constructor(private readonly updateEmployeeProfile: UpdateEmployeeProfile) {}

  async handle(command: UpdateEmployeeProfileCommand) {
    return await this.updateEmployeeProfile.execute(command);
  }
}
