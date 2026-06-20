import { UserService } from '../../src/modules/users/service';
import prisma from '../../src/config/database';

// Mock Prisma
jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('UserService', () => {
  let userService: UserService;
  const mockTenantId = 'tenant-123';

  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return all users for a tenant', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          tenantId: mockTenantId,
          fullName: 'John Doe',
          username: 'johndoe',
          phone: '+1234567890',
          role: 'RECEPTIONIST',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await userService.getAllUsers(mockTenantId);

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
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
      });
      expect(result).toEqual(mockUsers);
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const userData = {
        fullName: 'Jane Doe',
        username: 'janedoe',
        password: 'password123',
        phone: '+0987654321',
        role: 'MECHANIC' as const,
      };

      const mockUser = {
        id: 'user-2',
        tenantId: mockTenantId,
        fullName: userData.fullName,
        username: userData.username,
        phone: userData.phone,
        role: userData.role,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.createUser(mockTenantId, userData);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          tenantId_username: {
            tenantId: mockTenantId,
            username: userData.username,
          },
        },
      });
      expect(prisma.user.create).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should throw error if username already exists', async () => {
      const userData = {
        fullName: 'Jane Doe',
        username: 'johndoe', // existing username
        password: 'password123',
        phone: '+0987654321',
        role: 'MECHANIC' as const,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-user' });

      await expect(userService.createUser(mockTenantId, userData)).rejects.toThrow(
        'Username already exists in this tenant'
      );
    });
  });

  describe('updateUser', () => {
    it('should update an existing user', async () => {
      const userId = 'user-1';
      const updateData = {
        fullName: 'John Updated',
      };

      const mockExistingUser = {
        id: userId,
        tenantId: mockTenantId,
        fullName: 'John Doe',
        username: 'johndoe',
        phone: '+1234567890',
        role: 'RECEPTIONIST',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedUser = {
        ...mockExistingUser,
        fullName: updateData.fullName,
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockExistingUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);

      const result = await userService.updateUser(mockTenantId, userId, updateData);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: userId, tenantId: mockTenantId },
      });
      expect(prisma.user.update).toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should throw error if user not found', async () => {
      const userId = 'non-existent-user';
      const updateData = { fullName: 'John Updated' };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(userService.updateUser(mockTenantId, userId, updateData)).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('deleteUser', () => {
    it('should soft delete a user', async () => {
      const userId = 'user-1';
      const mockUser = {
        id: userId,
        tenantId: mockTenantId,
        fullName: 'John Doe',
        username: 'johndoe',
        phone: '+1234567890',
        role: 'RECEPTIONIST',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, isActive: false });

      await userService.deleteUser(mockTenantId, userId);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: userId, tenantId: mockTenantId },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { isActive: false },
      });
    });

    it('should throw error if user not found', async () => {
      const userId = 'non-existent-user';

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(userService.deleteUser(mockTenantId, userId)).rejects.toThrow('User not found');
    });
  });
});
