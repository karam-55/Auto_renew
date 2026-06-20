import { AuthRepository } from '../interfaces/AuthRepository';

export class AssignRoleToUser {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(userId: string, roleId: string): Promise<void> {
    const user = await this.authRepository.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    const role = await this.authRepository.findRoleById(roleId);
    
    if (!role) {
      throw new Error('Role not found');
    }

    await this.authRepository.assignRoleToUser(userId, roleId);
  }
}
