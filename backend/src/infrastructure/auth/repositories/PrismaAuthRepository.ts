import { AuthRepository } from '../../../application/auth/interfaces/AuthRepository';
import { User } from '../../../domain/auth/entities/User';
import { Role } from '../../../domain/auth/entities/Role';
import { Password } from '../../../domain/auth/value-objects/Password';
import prisma from '../../../config/database';

export class PrismaAuthRepository implements AuthRepository {
  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return null;
    }

    return this.mapToDomain(user);
  }

  async findByUsername(username: string): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: { username },
    });

    if (!user) {
      return null;
    }

    return this.mapToDomain(user);
  }

  async findByUsernameAndTenantId(username: string, tenantId: string): Promise<{ user: User; data: any } | null> {
    const userData = await prisma.user.findFirst({
      where: {
        tenantId,
        username,
        deletedAt: null,
      },
    });

    if (!userData) {
      return null;
    }

    const user = this.mapToDomain(userData);
    return { user, data: userData };
  }

  async create(user: User, fullName: string, phone: string, role: string): Promise<any> {
    const createdUser = await prisma.user.create({
      data: {
        id: user.id,
        tenantId: user.tenantId,
        username: user.username,
        fullName,
        passwordHash: user.password.getValue(),
        phone,
        role: role as any,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });

    return createdUser;
  }

  async update(user: User): Promise<User> {
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        username: user.username,
        passwordHash: user.password.getValue(),
        isActive: user.isActive,
        updatedAt: user.updatedAt,
      },
    });

    return this.mapToDomain(updatedUser);
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { role: roleId as any },
    });
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    // Not supported in current schema
  }

  async findRoleById(id: string): Promise<Role | null> {
    return Role.create(id, id, `Role ${id}`);
  }

  async findRoleByName(name: string): Promise<Role | null> {
    return Role.create(name, name, `Role ${name}`);
  }

  async tenantExists(tenantId: string): Promise<boolean> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    return tenant !== null;
  }

  async updateFailedLoginAttempts(userId: string, attempts: number, lockedUntil: Date | null): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil,
      },
    });
  }

  private mapToDomain(prismaUser: any): User {
    const password = new Password(prismaUser.passwordHash);

    const role = Role.create(
      prismaUser.role,
      prismaUser.role,
      `Role: ${prismaUser.role}`
    );

    return new User(
      prismaUser.id,
      password,
      prismaUser.username,
      prismaUser.tenantId,
      [role],
      prismaUser.isActive,
      prismaUser.createdAt,
      prismaUser.updatedAt
    );
  }
}
