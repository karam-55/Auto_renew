import prisma from '../../config/database';
import { CreateDepartmentInput, UpdateDepartmentInput, DepartmentResponse } from './types';

export class DepartmentService {
  async getAllDepartments(tenantId: string, skip?: number, limit?: number): Promise<DepartmentResponse[]> {
    const departments = await prisma.department.findMany({
      where: { tenantId },
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
      skip: skip || undefined,
      take: limit || undefined,
    });

    return departments;
  }

  async getDepartmentsCount(tenantId: string): Promise<number> {
    return prisma.department.count({ where: { tenantId } });
  }

  async getDepartmentById(tenantId: string, departmentId: string): Promise<DepartmentResponse | null> {
    const department = await prisma.department.findFirst({
      where: { id: departmentId, tenantId },
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
    });

    return department;
  }

  async searchDepartments(tenantId: string, query: string): Promise<DepartmentResponse[]> {
    const departments = await prisma.department.findMany({
      where: {
        tenantId,
        OR: [
          { nameAr: { contains: query, mode: 'insensitive' } },
          { nameEn: { contains: query, mode: 'insensitive' } },
        ],
      },
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

    return departments;
  }

  async createDepartment(tenantId: string, data: CreateDepartmentInput): Promise<DepartmentResponse> {
    // If managerId is provided, verify the employee exists and belongs to the tenant
    if (data.managerId) {
      const manager = await prisma.employee.findFirst({
        where: { id: data.managerId, tenantId },
      });

      if (!manager) {
        throw new Error('Manager not found');
      }
    }

    const department = await prisma.department.create({
      data: {
        tenantId,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        description: data.description,
        managerId: data.managerId,
        isActive: data.isActive ?? true,
      },
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
    });

    return department;
  }

  async updateDepartment(tenantId: string, departmentId: string, data: UpdateDepartmentInput): Promise<DepartmentResponse> {
    // Check if department exists and belongs to tenant
    const existingDepartment = await prisma.department.findFirst({
      where: { id: departmentId, tenantId },
    });

    if (!existingDepartment) {
      throw new Error('Department not found');
    }

    // If managerId is provided, verify the employee exists and belongs to the tenant
    if (data.managerId) {
      const manager = await prisma.employee.findFirst({
        where: { id: data.managerId, tenantId },
      });

      if (!manager) {
        throw new Error('Manager not found');
      }
    }

    const department = await prisma.department.update({
      where: { id: departmentId },
      data: {
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        description: data.description,
        managerId: data.managerId,
        isActive: data.isActive,
      },
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
    });

    return department;
  }

  async deleteDepartment(tenantId: string, departmentId: string): Promise<void> {
    // Check if department exists and belongs to tenant
    const existingDepartment = await prisma.department.findFirst({
      where: { id: departmentId, tenantId },
    });

    if (!existingDepartment) {
      throw new Error('Department not found');
    }

    // Check if department has any employees
    const employeesCount = await prisma.employee.count({
      where: { departmentId, tenantId },
    });

    if (employeesCount > 0) {
      throw new Error('Cannot delete department with existing employees');
    }

    await prisma.department.delete({
      where: { id: departmentId },
    });
  }

  async bulkDeleteDepartments(tenantId: string, ids: string[]): Promise<{ deleted: number; failed: number }> {
    let deleted = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        // Check if department exists and belongs to tenant
        const existingDepartment = await prisma.department.findFirst({
          where: { id, tenantId },
        });

        if (!existingDepartment) {
          failed++;
          continue;
        }

        // Check if department has any employees
        const employeesCount = await prisma.employee.count({
          where: { departmentId: id, tenantId },
        });

        if (employeesCount > 0) {
          failed++;
          continue;
        }

        await prisma.department.delete({
          where: { id },
        });
        deleted++;
      } catch {
        failed++;
      }
    }

    return { deleted, failed };
  }
}
