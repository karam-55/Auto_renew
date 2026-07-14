import prisma from '../../config/database';
import { hashPassword, comparePassword } from '../../shared/utils/auth';
import { CreateUserInput, UpdateUserInput, UserResponse } from './types';

export class UserService {
  async getAllUsers(tenantId: string, skip?: number, limit?: number): Promise<UserResponse[]> {
    const users = await prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        tenantId: true,
        fullName: true,
        username: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: skip || undefined,
      take: limit || undefined,
    });

    return users;
  }

  async getUsersCount(tenantId: string): Promise<number> {
    return prisma.user.count({ where: { tenantId } });
  }

  async getUserById(tenantId: string, userId: string): Promise<UserResponse | null> {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: {
        id: true,
        tenantId: true,
        fullName: true,
        username: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async createUser(tenantId: string, data: CreateUserInput): Promise<UserResponse> {
    // Check if username already exists in this tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        tenantId,
        username: data.username,
        deletedAt: null,
      },
    });

    if (existingUser) {
      throw new Error('Username already exists in this tenant');
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        tenantId,
        fullName: data.fullName,
        username: data.username,
        passwordHash,
        phone: data.phone,
        role: data.role,
        isActive: data.isActive ?? true,
      },
      select: {
        id: true,
        tenantId: true,
        fullName: true,
        username: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async updateUser(tenantId: string, userId: string, data: UpdateUserInput): Promise<UserResponse> {
    // Check if user exists and belongs to tenant
    const existingUser = await prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // If updating username, check if new username is available
    if (data.username && data.username !== existingUser.username) {
      const usernameExists = await prisma.user.findFirst({
        where: {
          tenantId,
          username: data.username,
          deletedAt: null,
        },
      });

      if (usernameExists) {
        throw new Error('Username already exists in this tenant');
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (data.fullName) updateData.fullName = data.fullName;
    if (data.username) updateData.username = data.username;
    if (data.phone) updateData.phone = data.phone;
    if (data.role) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.telegramChatId !== undefined) {
      updateData.telegramChatId = data.telegramChatId?.trim() || null;
    }
    if (data.password) {
      updateData.passwordHash = await hashPassword(data.password);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        tenantId: true,
        fullName: true,
        username: true,
        phone: true,
        role: true,
        isActive: true,
        telegramChatId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async deleteUser(tenantId: string, userId: string): Promise<void> {
    // Check if user exists and belongs to tenant
    const existingUser = await prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Soft delete (set isActive to false)
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  }

  async changePassword(tenantId: string, userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }
}
