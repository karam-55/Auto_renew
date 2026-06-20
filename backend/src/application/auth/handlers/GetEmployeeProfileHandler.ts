import { GetEmployeeProfile } from '../use-cases/GetEmployeeProfile';
import { GetEmployeeProfileQuery } from '../queries/GetEmployeeProfileQuery';

export class GetEmployeeProfileHandler {
  constructor(private readonly getEmployeeProfile: GetEmployeeProfile) {}

  async handle(query: GetEmployeeProfileQuery) {
    return await this.getEmployeeProfile.execute(query);
  }
}
