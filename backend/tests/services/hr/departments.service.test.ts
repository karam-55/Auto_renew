import { DepartmentService } from '../../../src/modules/departments/service';
import prisma from '../../../src/config/database';

// Mock Prisma
jest.mock('../../../src/config/database', () => ({
  __esModule: true,
  default: {
    department: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    employee: {
      findFirst: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('DepartmentService', () => {
  let departmentService: DepartmentService;
  const mockTenantId = 'tenant-123';

  beforeEach(() => {
    departmentService = new DepartmentService();
    jest.clearAllMocks();
  });

  describe('getAllDepartments', () => {
    it('should return all departments for a tenant', async () => {
      const mockDepartments = [
        {
          id: 'dept-1',
          tenantId: mockTenantId,
          nameAr: 'قسم الصيانة',
          nameEn: 'Maintenance',
          description: 'Maintenance department',
          managerId: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.department.findMany as jest.Mock).mockResolvedValue(mockDepartments);

      const result = await departmentService.getAllDepartments(mockTenantId);

      expect(prisma.department.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
        select: {
          id: true,
          tenantId: true,
          nameAr: true,
          nameEn: true,
          description: true,
          managerId: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockDepartments);
    });
  });

  describe('getDepartmentById', () => {
    it('should return department by ID', async () => {
      const mockDepartment = {
        id: 'dept-1',
        tenantId: mockTenantId,
        nameAr: 'قسم الصيانة',
        nameEn: 'Maintenance',
        description: 'Maintenance department',
        managerId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.department.findFirst as jest.Mock).mockResolvedValue(mockDepartment);

      const result = await departmentService.getDepartmentById(mockTenantId, 'dept-1');

      expect(prisma.department.findFirst).toHaveBeenCalledWith({
        where: { id: 'dept-1', tenantId: mockTenantId },
        select: expect.any(Object),
      });
      expect(result).toEqual(mockDepartment);
    });

    it('should return null if department not found', async () => {
      (prisma.department.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await departmentService.getDepartmentById(mockTenantId, 'non-existent');

      expect(result).toBeNull();
    });
  });

  describe('searchDepartments', () => {
    it('should search departments by name', async () => {
      const mockDepartments = [
        {
          id: 'dept-1',
          tenantId: mockTenantId,
          nameAr: 'قسم الصيانة',
          nameEn: 'Maintenance',
          description: 'Maintenance department',
          managerId: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.department.findMany as jest.Mock).mockResolvedValue(mockDepartments);

      const result = await departmentService.searchDepartments(mockTenantId, 'صيانة');

      expect(prisma.department.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          OR: [
            { nameAr: { contains: 'صيانة', mode: 'insensitive' } },
            { nameEn: { contains: 'صيانة', mode: 'insensitive' } },
          ],
        },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockDepartments);
    });
  });

  describe('createDepartment', () => {
    it('should create a new department', async () => {
      const departmentData = {
        nameAr: 'قسم المبيعات',
        nameEn: 'Sales',
        description: 'Sales department',
        managerId: undefined,
        isActive: true,
      };

      const mockDepartment = {
        id: 'dept-2',
        tenantId: mockTenantId,
        ...departmentData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.department.create as jest.Mock).mockResolvedValue(mockDepartment);

      const result = await departmentService.createDepartment(mockTenantId, departmentData);

      expect(prisma.department.create).toHaveBeenCalledWith({
        data: {
          tenantId: mockTenantId,
          nameAr: departmentData.nameAr,
          nameEn: departmentData.nameEn,
          description: departmentData.description,
          managerId: departmentData.managerId,
          isActive: departmentData.isActive,
        },
        select: expect.any(Object),
      });
      expect(result).toEqual(mockDepartment);
    });

    it('should throw error if managerId is provided but employee not found', async () => {
      const departmentData = {
        nameAr: 'قسم المبيعات',
        managerId: 'employee-123',
      };

      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        departmentService.createDepartment(mockTenantId, departmentData)
      ).rejects.toThrow('Manager not found');
    });
  });

  describe('updateDepartment', () => {
    it('should update an existing department', async () => {
      const existingDepartment = {
        id: 'dept-1',
        tenantId: mockTenantId,
        nameAr: 'قسم الصيانة',
        nameEn: 'Maintenance',
        description: 'Maintenance department',
        managerId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateData = {
        nameAr: 'قسم الصيانة العامة',
        isActive: false,
      };

      const updatedDepartment = {
        ...existingDepartment,
        ...updateData,
      };

      (prisma.department.findFirst as jest.Mock).mockResolvedValue(existingDepartment);
      (prisma.department.update as jest.Mock).mockResolvedValue(updatedDepartment);

      const result = await departmentService.updateDepartment(mockTenantId, 'dept-1', updateData);

      expect(prisma.department.update).toHaveBeenCalledWith({
        where: { id: 'dept-1' },
        data: updateData,
        select: expect.any(Object),
      });
      expect(result).toEqual(updatedDepartment);
    });

    it('should throw error if department not found', async () => {
      (prisma.department.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        departmentService.updateDepartment(mockTenantId, 'non-existent', { nameAr: 'new name' })
      ).rejects.toThrow('Department not found');
    });
  });

  describe('deleteDepartment', () => {
    it('should delete a department', async () => {
      const existingDepartment = {
        id: 'dept-1',
        tenantId: mockTenantId,
        nameAr: 'قسم الصيانة',
        nameEn: 'Maintenance',
        description: 'Maintenance department',
        managerId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.department.findFirst as jest.Mock).mockResolvedValue(existingDepartment);
      (prisma.employee.count as jest.Mock).mockResolvedValue(0);
      (prisma.department.delete as jest.Mock).mockResolvedValue(existingDepartment);

      await departmentService.deleteDepartment(mockTenantId, 'dept-1');

      expect(prisma.department.delete).toHaveBeenCalledWith({
        where: { id: 'dept-1' },
      });
    });

    it('should throw error if department has employees', async () => {
      const existingDepartment = {
        id: 'dept-1',
        tenantId: mockTenantId,
        nameAr: 'قسم الصيانة',
        nameEn: 'Maintenance',
        description: 'Maintenance department',
        managerId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.department.findFirst as jest.Mock).mockResolvedValue(existingDepartment);
      (prisma.employee.count as jest.Mock).mockResolvedValue(5);

      await expect(
        departmentService.deleteDepartment(mockTenantId, 'dept-1')
      ).rejects.toThrow('Cannot delete department with existing employees');
    });

    it('should throw error if department not found', async () => {
      (prisma.department.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        departmentService.deleteDepartment(mockTenantId, 'non-existent')
      ).rejects.toThrow('Department not found');
    });
  });
});
