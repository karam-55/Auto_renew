import { Password } from '../value-objects/Password';
import { Role } from './Role';

export class User {
  constructor(
    public readonly id: string,
    public readonly password: Password,
    public readonly username: string,
    public readonly tenantId: string,
    public readonly roles: Role[],
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static create(
    id: string,
    password: Password,
    username: string,
    tenantId: string,
    roles: Role[] = []
  ): User {
    return new User(
      id,
      password,
      username,
      tenantId,
      roles,
      true,
      new Date(),
      new Date()
    );
  }

  hasRole(roleName: string): boolean {
    return this.roles.some(role => role.name === roleName);
  }

  hasPermission(permissionName: string): boolean {
    return this.roles.some(role =>
      role.permissions.some(permission => permission.name === permissionName)
    );
  }
}
