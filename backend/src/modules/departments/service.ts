import prisma from '../../config/database';
import { CreateDepartmentInput, UpdateDepartmentInput, DepartmentResponse } from './types';

export class DepartmentService {
  private mapDepartment(dept: any): DepartmentResponse {
    return {
      ...dept,
      fixedMonthlySalarySYP: dept.fixedMonthlySalarySYP ? Number(dept.fixedMonthlySalarySYP) : null,
      fixedMonthlySalaryUSD: dept.fixedMonthlySalaryUSD ? Number(dept.fixedMonthlySalaryUSD) : null,
      workHoursPerMonth: dept.workHoursPerMonth ? Number(dept.workHoursPerMonth) : null,
      calculatedHourlyRateSYP: dept.calculatedHourlyRateSYP ? Number(dept.calculatedHourlyRateSYP) : null,
    };
  }

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
        hasFixedSalary: true,
        fixedMonthlySalarySYP: true,
        fixedMonthlySalaryUSD: true,
        workHoursPerMonth: true,
        calculatedHourlyRateSYP: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: skip || undefined,
      take: limit || undefined,
    });

    return departments.map(d => this.mapDepartment(d));
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
        hasFixedSalary: true,
        fixedMonthlySalarySYP: true,
        fixedMonthlySalaryUSD: true,
        workHoursPerMonth: true,
        calculatedHourlyRateSYP: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return department ? this.mapDepartment(department) : null;
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
        hasFixedSalary: true,
        fixedMonthlySalarySYP: true,
        fixedMonthlySalaryUSD: true,
        workHoursPerMonth: true,
        calculatedHourlyRateSYP: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return departments.map(d => this.mapDepartment(d));
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

    // Calculate hourly rate if fixed salary is enabled
    let calculatedHourlyRateSYP: number | null = null;
    if (data.hasFixedSalary && data.fixedMonthlySalarySYP && data.workHoursPerMonth) {
      calculatedHourlyRateSYP = Number(data.fixedMonthlySalarySYP) / Number(data.workHoursPerMonth);
    }

    const department = await prisma.department.create({
      data: {
        tenantId,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        description: data.description,
        managerId: data.managerId,
        isActive: data.isActive ?? true,
        hasFixedSalary: data.hasFixedSalary ?? false,
        fixedMonthlySalarySYP: data.fixedMonthlySalarySYP,
        fixedMonthlySalaryUSD: data.fixedMonthlySalaryUSD,
        workHoursPerMonth: data.workHoursPerMonth ?? 160,
        calculatedHourlyRateSYP,
      },
      select: {
        id: true,
        tenantId: true,
        nameAr: true,
        nameEn: true,
        description: true,
        managerId: true,
        isActive: true,
        hasFixedSalary: true,
        fixedMonthlySalarySYP: true,
        fixedMonthlySalaryUSD: true,
        workHoursPerMonth: true,
        calculatedHourlyRateSYP: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.mapDepartment(department);
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

    // Recalculate hourly rate if salary fields updated
    let updateData: any = {
      nameAr: data.nameAr,
      nameEn: data.nameEn,
      description: data.description,
      managerId: data.managerId,
      isActive: data.isActive,
    };

    if (data.hasFixedSalary !== undefined) {
      updateData.hasFixedSalary = data.hasFixedSalary;
    }
    if (data.fixedMonthlySalarySYP !== undefined) {
      updateData.fixedMonthlySalarySYP = data.fixedMonthlySalarySYP;
    }
    if (data.fixedMonthlySalaryUSD !== undefined) {
      updateData.fixedMonthlySalaryUSD = data.fixedMonthlySalaryUSD;
    }
    if (data.workHoursPerMonth !== undefined) {
      updateData.workHoursPerMonth = data.workHoursPerMonth;
    }

    // Recalculate hourly rate if fixed salary config changed
    const existing = existingDepartment as any;
    const hasFixedSalary = data.hasFixedSalary ?? existing.hasFixedSalary;
    const fixedMonthlySalarySYP = data.fixedMonthlySalarySYP ?? existing.fixedMonthlySalarySYP;
    const workHoursPerMonth = data.workHoursPerMonth ?? existing.workHoursPerMonth;
    if (hasFixedSalary && fixedMonthlySalarySYP && workHoursPerMonth) {
      updateData.calculatedHourlyRateSYP = Number(fixedMonthlySalarySYP) / Number(workHoursPerMonth);
    } else if (data.hasFixedSalary === false) {
      updateData.calculatedHourlyRateSYP = null;
    }

    const department = await prisma.department.update({
      where: { id: departmentId },
      data: updateData,
      select: {
        id: true,
        tenantId: true,
        nameAr: true,
        nameEn: true,
        description: true,
        managerId: true,
        isActive: true,
        hasFixedSalary: true,
        fixedMonthlySalarySYP: true,
        fixedMonthlySalaryUSD: true,
        workHoursPerMonth: true,
        calculatedHourlyRateSYP: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.mapDepartment(department);
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
