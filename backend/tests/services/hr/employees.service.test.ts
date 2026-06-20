import { EmployeeService } from '../../../src/modules/employees/service';
import prisma from '../../../src/config/database';

// Mock Prisma
jest.mock('../../../src/config/database', () => ({
  __esModule: true,
  default: {
    employee: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    department: {
      findFirst: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
    attendance: {
      count: jest.fn(),
    },
    payrollRecord: {
      count: jest.fn(),
    },
  },
}));

describe('EmployeeService', () => {
  let employeeService: EmployeeService;
  const mockTenantId = 'tenant-123';

  beforeEach(() => {
    employeeService = new EmployeeService();
    jest.clearAllMocks();
  });

  describe('getAllEmployees', () => {
    it('should return all employees for a tenant', async () => {
      const mockEmployees = [
        {
          id: 'emp-1',
          tenantId: mockTenantId,
          userId: null,
          employeeCode: 'EMP001',
          fullNameAr: 'أحمد محمد',
          fullNameEn: 'Ahmed Mohammed',
          position: 'Mechanic',
          departmentId: 'dept-1',
          hireDate: new Date('2024-01-01'),
          salarySYP: 500000,
          salaryUSD: null,
          contractType: 'FULL_TIME',
          status: 'ACTIVE',
          phone: '+963912345678',
          address: 'Damascus',
          emergencyContact: null,
          idNumber: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.employee.findMany as jest.Mock).mockResolvedValue(mockEmployees);

      const result = await employeeService.getAllEmployees(mockTenantId);

      expect(prisma.employee.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(
        mockEmployees.map(e => ({
          ...e,
          salarySYP: Number(e.salarySYP),
          salaryUSD: e.salaryUSD ? Number(e.salaryUSD) : undefined,
        }))
      );
    });
  });

  describe('getEmployeeById', () => {
    it('should return employee by ID', async () => {
      const mockEmployee = {
        id: 'emp-1',
        tenantId: mockTenantId,
        userId: null,
        employeeCode: 'EMP001',
        fullNameAr: 'أحمد محمد',
        fullNameEn: 'Ahmed Mohammed',
        position: 'Mechanic',
        departmentId: 'dept-1',
        hireDate: new Date('2024-01-01'),
        salarySYP: 500000,
        salaryUSD: null,
        contractType: 'FULL_TIME',
        status: 'ACTIVE',
        phone: '+963912345678',
        address: 'Damascus',
        emergencyContact: null,
        idNumber: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(mockEmployee);

      const result = await employeeService.getEmployeeById(mockTenantId, 'emp-1');

      expect(prisma.employee.findFirst).toHaveBeenCalledWith({
        where: { id: 'emp-1', tenantId: mockTenantId },
        select: expect.any(Object),
      });
      expect(result).not.toBeNull();
    });

    it('should return null if employee not found', async () => {
      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await employeeService.getEmployeeById(mockTenantId, 'non-existent');

      expect(result).toBeNull();
    });
  });

  describe('searchEmployees', () => {
    it('should search employees by name, code, or phone', async () => {
      const mockEmployees = [
        {
          id: 'emp-1',
          tenantId: mockTenantId,
          userId: null,
          employeeCode: 'EMP001',
          fullNameAr: 'أحمد محمد',
          fullNameEn: 'Ahmed Mohammed',
          position: 'Mechanic',
          departmentId: 'dept-1',
          hireDate: new Date('2024-01-01'),
          salarySYP: 500000,
          salaryUSD: null,
          contractType: 'FULL_TIME',
          status: 'ACTIVE',
          phone: '+963912345678',
          address: 'Damascus',
          emergencyContact: null,
          idNumber: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.employee.findMany as jest.Mock).mockResolvedValue(mockEmployees);

      const result = await employeeService.searchEmployees(mockTenantId, 'أحمد');

      expect(prisma.employee.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          OR: expect.any(Array),
        },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('getEmployeesByDepartment', () => {
    it('should return employees for a specific department', async () => {
      const mockEmployees = [
        {
          id: 'emp-1',
          tenantId: mockTenantId,
          userId: null,
          employeeCode: 'EMP001',
          fullNameAr: 'أحمد محمد',
          fullNameEn: 'Ahmed Mohammed',
          position: 'Mechanic',
          departmentId: 'dept-1',
          hireDate: new Date('2024-01-01'),
          salarySYP: 500000,
          salaryUSD: null,
          contractType: 'FULL_TIME',
          status: 'ACTIVE',
          phone: '+963912345678',
          address: 'Damascus',
          emergencyContact: null,
          idNumber: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.employee.findMany as jest.Mock).mockResolvedValue(mockEmployees);

      const result = await employeeService.getEmployeesByDepartment(mockTenantId, 'dept-1');

      expect(prisma.employee.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId, departmentId: 'dept-1' },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('createEmployee', () => {
    it('should create a new employee', async () => {
      const employeeData = {
        employeeCode: 'EMP002',
        fullNameAr: 'محمد علي',
        fullNameEn: 'Mohammed Ali',
        position: 'Electrician',
        departmentId: 'dept-1',
        hireDate: new Date('2024-02-01'),
        salarySYP: 450000,
        salaryUSD: undefined,
        contractType: 'FULL_TIME' as const,
        status: 'ACTIVE' as const,
        phone: '+963912345679',
        address: 'Aleppo',
        emergencyContact: undefined,
        idNumber: undefined,
      };

      const mockEmployee = {
        id: 'emp-2',
        tenantId: mockTenantId,
        userId: null,
        ...employeeData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.department.findFirst as jest.Mock).mockResolvedValue({ id: 'dept-1' });
      (prisma.employee.create as jest.Mock).mockResolvedValue(mockEmployee);

      const result = await employeeService.createEmployee(mockTenantId, employeeData);

      expect(prisma.employee.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: mockTenantId,
          employeeCode: employeeData.employeeCode,
          fullNameAr: employeeData.fullNameAr,
        }),
        select: expect.any(Object),
      });
      expect(result).not.toBeNull();
    });

    it('should throw error if employee code already exists', async () => {
      const employeeData = {
        employeeCode: 'EMP001', // existing code
        fullNameAr: 'محمد علي',
        position: 'Electrician',
        departmentId: 'dept-1',
        hireDate: new Date('2024-02-01'),
        salarySYP: 450000,
        contractType: 'FULL_TIME' as const,
        status: 'ACTIVE' as const,
        phone: '+963912345679',
      };

      (prisma.employee.findFirst as jest.Mock).mockResolvedValue({ id: 'existing-employee' });

      await expect(
        employeeService.createEmployee(mockTenantId, employeeData)
      ).rejects.toThrow('Employee with this code already exists');
    });

    it('should throw error if department not found', async () => {
      const employeeData = {
        employeeCode: 'EMP002',
        fullNameAr: 'محمد علي',
        position: 'Electrician',
        departmentId: 'non-existent-dept',
        hireDate: new Date('2024-02-01'),
        salarySYP: 450000,
        contractType: 'FULL_TIME' as const,
        status: 'ACTIVE' as const,
        phone: '+963912345679',
      };

      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.department.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        employeeService.createEmployee(mockTenantId, employeeData)
      ).rejects.toThrow('Department not found');
    });
  });

  describe('updateEmployee', () => {
    it('should update an existing employee', async () => {
      const existingEmployee = {
        id: 'emp-1',
        tenantId: mockTenantId,
        userId: null,
        employeeCode: 'EMP001',
        fullNameAr: 'أحمد محمد',
        fullNameEn: 'Ahmed Mohammed',
        position: 'Mechanic',
        departmentId: 'dept-1',
        hireDate: new Date('2024-01-01'),
        salarySYP: 500000,
        salaryUSD: null,
        contractType: 'FULL_TIME',
        status: 'ACTIVE',
        phone: '+963912345678',
        address: 'Damascus',
        emergencyContact: null,
        idNumber: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateData = {
        position: 'Senior Mechanic',
        salarySYP: 550000,
      };

      const updatedEmployee = {
        ...existingEmployee,
        ...updateData,
      };

      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(existingEmployee);
      (prisma.employee.update as jest.Mock).mockResolvedValue(updatedEmployee);

      const result = await employeeService.updateEmployee(mockTenantId, 'emp-1', updateData);

      expect(prisma.employee.update).toHaveBeenCalledWith({
        where: { id: 'emp-1' },
        data: updateData,
        select: expect.any(Object),
      });
      expect(result).not.toBeNull();
    });

    it('should throw error if employee not found', async () => {
      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        employeeService.updateEmployee(mockTenantId, 'non-existent', { position: 'New Position' })
      ).rejects.toThrow('Employee not found');
    });
  });

  describe('deleteEmployee', () => {
    it('should delete an employee', async () => {
      const existingEmployee = {
        id: 'emp-1',
        tenantId: mockTenantId,
        userId: null,
        employeeCode: 'EMP001',
        fullNameAr: 'أحمد محمد',
        fullNameEn: 'Ahmed Mohammed',
        position: 'Mechanic',
        departmentId: 'dept-1',
        hireDate: new Date('2024-01-01'),
        salarySYP: 500000,
        salaryUSD: null,
        contractType: 'FULL_TIME',
        status: 'ACTIVE',
        phone: '+963912345678',
        address: 'Damascus',
        emergencyContact: null,
        idNumber: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(existingEmployee);
      (prisma.attendance.count as jest.Mock).mockResolvedValue(0);
      (prisma.payrollRecord.count as jest.Mock).mockResolvedValue(0);
      (prisma.employee.delete as jest.Mock).mockResolvedValue(existingEmployee);

      await employeeService.deleteEmployee(mockTenantId, 'emp-1');

      expect(prisma.employee.delete).toHaveBeenCalledWith({
        where: { id: 'emp-1' },
      });
    });

    it('should throw error if employee has attendance records', async () => {
      const existingEmployee = {
        id: 'emp-1',
        tenantId: mockTenantId,
        userId: null,
        employeeCode: 'EMP001',
        fullNameAr: 'أحمد محمد',
        fullNameEn: 'Ahmed Mohammed',
        position: 'Mechanic',
        departmentId: 'dept-1',
        hireDate: new Date('2024-01-01'),
        salarySYP: 500000,
        salaryUSD: null,
        contractType: 'FULL_TIME',
        status: 'ACTIVE',
        phone: '+963912345678',
        address: 'Damascus',
        emergencyContact: null,
        idNumber: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(existingEmployee);
      (prisma.attendance.count as jest.Mock).mockResolvedValue(10);

      await expect(
        employeeService.deleteEmployee(mockTenantId, 'emp-1')
      ).rejects.toThrow('Cannot delete employee with existing attendance records');
    });

    it('should throw error if employee has payroll records', async () => {
      const existingEmployee = {
        id: 'emp-1',
        tenantId: mockTenantId,
        userId: null,
        employeeCode: 'EMP001',
        fullNameAr: 'أحمد محمد',
        fullNameEn: 'Ahmed Mohammed',
        position: 'Mechanic',
        departmentId: 'dept-1',
        hireDate: new Date('2024-01-01'),
        salarySYP: 500000,
        salaryUSD: null,
        contractType: 'FULL_TIME',
        status: 'ACTIVE',
        phone: '+963912345678',
        address: 'Damascus',
        emergencyContact: null,
        idNumber: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(existingEmployee);
      (prisma.attendance.count as jest.Mock).mockResolvedValue(0);
      (prisma.payrollRecord.count as jest.Mock).mockResolvedValue(5);

      await expect(
        employeeService.deleteEmployee(mockTenantId, 'emp-1')
      ).rejects.toThrow('Cannot delete employee with existing payroll records');
    });
  });
});
