import { User } from '../../../domain/auth/entities/User';
import { Role } from '../../../domain/auth/entities/Role';

export interface AuthRepository {
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByUsernameAndTenantId(username: string, tenantId: string): Promise<{ user: User; data: any } | null>;
  create(user: User, fullName: string, phone: string, role: string): Promise<any>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<void>;
  assignRoleToUser(userId: string, roleId: string): Promise<void>;
  removeRoleFromUser(userId: string, roleId: string): Promise<void>;
  findRoleById(id: string): Promise<Role | null>;
  findRoleByName(name: string): Promise<Role | null>;
  tenantExists(tenantId: string): Promise<boolean>;
  updateFailedLoginAttempts(userId: string, attempts: number, lockedUntil: Date | null): Promise<void>;
}
