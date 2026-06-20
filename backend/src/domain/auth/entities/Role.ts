import { Permission } from './Permission';

export class Role {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly permissions: Permission[] = [],
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static create(
    id: string,
    name: string,
    description: string,
    permissions: Permission[] = []
  ): Role {
    return new Role(
      id,
      name,
      description,
      permissions,
      new Date(),
      new Date()
    );
  }

  hasPermission(permissionName: string): boolean {
    return this.permissions.some(permission => permission.name === permissionName);
  }
}
