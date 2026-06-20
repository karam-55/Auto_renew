import prisma from '../../config/database';
import { CreateEmployeeInput, UpdateEmployeeInput, EmployeeResponse } from './types';

export class EmployeeService {
  async getAllEmployees(tenantId: string, page: number = 1, limit: number = 50): Promise<{ employees: EmployeeResponse[], total: number }> {
    const skip = (page - 1) * limit;

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where: { tenantId },
        select: {
          id: true,
          tenantId: true,
          userId: true,
          employeeCode: true,
          fullNameAr: true,
          fullNameEn: true,
          position: true,
          departmentId: true,
          hireDate: true,
          salarySYP: true,
          salaryUSD: true,
          hourlyRate: true,
          contractType: true,
          status: true,
          phone: true,
          address: true,
          emergencyContact: true,
          idNumber: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.employee.count({ where: { tenantId } }),
    ]);

    return {
      employees: employees.map(e => ({
        ...e,
        salarySYP: Number(e.salarySYP),
        salaryUSD: e.salaryUSD ? Number(e.salaryUSD) : undefined,
        hourlyRate: e.hourlyRate ? Number(e.hourlyRate) : undefined,
        departmentHasFixedSalary: false, // Will be populated by frontend or separate query
      })),
      total,
    };
  }

  async getEmployeeById(tenantId: string, employeeId: string): Promise<EmployeeResponse | null> {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        employeeCode: true,
        fullNameAr: true,
        fullNameEn: true,
        position: true,
        departmentId: true,
        hireDate: true,
        salarySYP: true,
        salaryUSD: true,
        hourlyRate: true,
        contractType: true,
        status: true,
        phone: true,
        address: true,
        emergencyContact: true,
        idNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!employee) return null;
    return {
      ...employee,
      salarySYP: Number(employee.salarySYP),
      salaryUSD: employee.salaryUSD ? Number(employee.salaryUSD) : undefined,
      hourlyRate: employee.hourlyRate ? Number(employee.hourlyRate) : undefined,
      departmentHasFixedSalary: false,
    };
  }

  async searchEmployees(tenantId: string, query: string): Promise<EmployeeResponse[]> {
    const employees = await prisma.employee.findMany({
      where: {
        tenantId,
        OR: [
          { fullNameAr: { contains: query, mode: 'insensitive' } },
          { fullNameEn: { contains: query, mode: 'insensitive' } },
          { employeeCode: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
        ],
      },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        employeeCode: true,
        fullNameAr: true,
        fullNameEn: true,
        position: true,
        departmentId: true,
        hireDate: true,
        salarySYP: true,
        salaryUSD: true,
        hourlyRate: true,
        contractType: true,
        status: true,
        phone: true,
        address: true,
        emergencyContact: true,
        idNumber: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return employees.map(e => ({
      ...e,
      salarySYP: Number(e.salarySYP),
      salaryUSD: e.salaryUSD ? Number(e.salaryUSD) : undefined,
      hourlyRate: e.hourlyRate ? Number(e.hourlyRate) : undefined,
      departmentHasFixedSalary: false,
    }));
  }

  async getEmployeesByDepartment(tenantId: string, departmentId: string): Promise<EmployeeResponse[]> {
    const employees = await prisma.employee.findMany({
      where: { tenantId, departmentId },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        employeeCode: true,
        fullNameAr: true,
        fullNameEn: true,
        position: true,
        departmentId: true,
        hireDate: true,
        salarySYP: true,
        salaryUSD: true,
        hourlyRate: true,
        contractType: true,
        status: true,
        phone: true,
        address: true,
        emergencyContact: true,
        idNumber: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return employees.map(e => ({
      ...e,
      salarySYP: Number(e.salarySYP),
      salaryUSD: e.salaryUSD ? Number(e.salaryUSD) : undefined,
      hourlyRate: e.hourlyRate ? Number(e.hourlyRate) : undefined,
      departmentHasFixedSalary: false,
    }));
  }

  async createEmployee(tenantId: string, data: CreateEmployeeInput): Promise<EmployeeResponse> {
    // Check if employee code already exists in this tenant
    const existingEmployee = await prisma.employee.findFirst({
      where: { tenantId, employeeCode: data.employeeCode },
    });

    if (existingEmployee) {
      throw new Error('Employee with this code already exists');
    }

    // Verify department exists and belongs to tenant
    const department = await prisma.department.findFirst({
      where: { id: data.departmentId, tenantId },
    });

    if (!department) {
      throw new Error('Department not found');
    }

    const dept = department as any;

    // If department has fixed salary, override hourlyRate with department's rate
    let finalHourlyRate = data.hourlyRate;
    let finalSalarySYP = data.salarySYP;
    if (dept.hasFixedSalary && dept.calculatedHourlyRateSYP) {
      finalHourlyRate = Number(dept.calculatedHourlyRateSYP);
      // Recalculate salary based on fixed hourly rate and standard hours
      finalSalarySYP = finalHourlyRate * (dept.workHoursPerMonth ?? 160);
    }

    // Validate salary
    if (finalSalarySYP <= 0) {
      throw new Error('Salary must be greater than 0');
    }

    // If userId is provided, verify the user exists and belongs to the tenant
    if (data.userId) {
      const user = await prisma.user.findFirst({
        where: { id: data.userId, tenantId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check if user is already linked to an employee
      const existingEmployeeUser = await prisma.employee.findFirst({
        where: { userId: data.userId },
      });

      if (existingEmployeeUser) {
        throw new Error('User is already linked to an employee');
      }
    }

    const employee = await prisma.employee.create({
      data: {
        tenantId,
        userId: data.userId,
        employeeCode: data.employeeCode,
        fullNameAr: data.fullNameAr,
        fullNameEn: data.fullNameEn,
        position: data.position,
        departmentId: data.departmentId,
        hireDate: data.hireDate,
        salarySYP: finalSalarySYP,
        salaryUSD: data.salaryUSD,
        hourlyRate: finalHourlyRate,
        contractType: data.contractType,
        status: data.status ?? 'ACTIVE',
        phone: data.phone,
        address: data.address,
        emergencyContact: data.emergencyContact,
        idNumber: data.idNumber,
      },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        employeeCode: true,
        fullNameAr: true,
        fullNameEn: true,
        position: true,
        departmentId: true,
        hireDate: true,
        salarySYP: true,
        salaryUSD: true,
        hourlyRate: true,
        contractType: true,
        status: true,
        phone: true,
        address: true,
        emergencyContact: true,
        idNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      ...employee,
      salarySYP: Number(employee.salarySYP),
      salaryUSD: employee.salaryUSD ? Number(employee.salaryUSD) : undefined,
      hourlyRate: employee.hourlyRate ? Number(employee.hourlyRate) : undefined,
      departmentHasFixedSalary: dept.hasFixedSalary ?? false,
    };
  }

  async updateEmployee(tenantId: string, employeeId: string, data: UpdateEmployeeInput): Promise<EmployeeResponse> {
    // Check if employee exists and belongs to tenant
    const existingEmployee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
    });

    if (!existingEmployee) {
      throw new Error('Employee not found');
    }

    // If updating employee code, check if new code is available
    if (data.employeeCode && data.employeeCode !== existingEmployee.employeeCode) {
      const codeExists = await prisma.employee.findFirst({
        where: { tenantId, employeeCode: data.employeeCode },
      });

      if (codeExists) {
        throw new Error('Employee with this code already exists');
      }
    }

    // If updating department, verify it exists and belongs to tenant
    let department: any = null;
    if (data.departmentId) {
      department = await prisma.department.findFirst({
        where: { id: data.departmentId, tenantId },
      });

      if (!department) {
        throw new Error('Department not found');
      }
    } else {
      department = await prisma.department.findFirst({
        where: { id: existingEmployee.departmentId, tenantId },
      });
    }

    const dept = department as any;

    // If department has fixed salary, override hourlyRate with department's rate
    let finalHourlyRate = data.hourlyRate;
    let finalSalarySYP = data.salarySYP;
    if (dept && dept.hasFixedSalary && dept.calculatedHourlyRateSYP) {
      finalHourlyRate = Number(dept.calculatedHourlyRateSYP);
      finalSalarySYP = finalHourlyRate * (dept.workHoursPerMonth ?? 160);
    }

    // If updating userId, verify the user exists and belongs to the tenant
    if (data.userId) {
      const user = await prisma.user.findFirst({
        where: { id: data.userId, tenantId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check if user is already linked to another employee
      const existingEmployeeUser = await prisma.employee.findFirst({
        where: { userId: data.userId, id: { not: employeeId } },
      });

      if (existingEmployeeUser) {
        throw new Error('User is already linked to another employee');
      }
    }

    const employee = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        userId: data.userId,
        employeeCode: data.employeeCode,
        fullNameAr: data.fullNameAr,
        fullNameEn: data.fullNameEn,
        position: data.position,
        departmentId: data.departmentId,
        hireDate: data.hireDate,
        salarySYP: finalSalarySYP,
        salaryUSD: data.salaryUSD,
        hourlyRate: finalHourlyRate,
        contractType: data.contractType,
        status: data.status,
        phone: data.phone,
        address: data.address,
        emergencyContact: data.emergencyContact,
        idNumber: data.idNumber,
      },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        employeeCode: true,
        fullNameAr: true,
        fullNameEn: true,
        position: true,
        departmentId: true,
        hireDate: true,
        salarySYP: true,
        salaryUSD: true,
        hourlyRate: true,
        contractType: true,
        status: true,
        phone: true,
        address: true,
        emergencyContact: true,
        idNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      ...employee,
      salarySYP: Number(employee.salarySYP),
      salaryUSD: employee.salaryUSD ? Number(employee.salaryUSD) : undefined,
      hourlyRate: employee.hourlyRate ? Number(employee.hourlyRate) : undefined,
      departmentHasFixedSalary: dept ? (dept.hasFixedSalary ?? false) : false,
    };
  }

  async assignRole(tenantId: string, employeeId: string, roleId: string): Promise<any> {
    const existingEmployee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
    });

    if (!existingEmployee) {
      throw new Error('Employee not found');
    }

    const role = await prisma.role.findFirst({
      where: { id: roleId, tenantId },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    const updated = await prisma.employee.update({
      where: { id: employeeId },
      data: { roleId },
      include: { role: true },
    });

    return {
      ...updated,
      salarySYP: Number(updated.salarySYP),
      salaryUSD: updated.salaryUSD ? Number(updated.salaryUSD) : undefined,
      hourlyRate: updated.hourlyRate ? Number(updated.hourlyRate) : undefined,
    };
  }

  async deleteEmployee(tenantId: string, employeeId: string): Promise<void> {
    // Check if employee exists and belongs to tenant
    const existingEmployee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
    });

    if (!existingEmployee) {
      throw new Error('Employee not found');
    }

    // Check if employee has any attendance records
    const attendanceCount = await prisma.attendance.count({
      where: { employeeId, tenantId },
    });

    if (attendanceCount > 0) {
      throw new Error('Cannot delete employee with existing attendance records');
    }

    // Check if employee has any payroll records
    const payrollCount = await prisma.payrollRecord.count({
      where: { employeeId },
    });

    if (payrollCount > 0) {
      throw new Error('Cannot delete employee with existing payroll records');
    }

    await prisma.employee.delete({
      where: { id: employeeId },
    });
  }

  async bulkDeleteEmployees(tenantId: string, ids: string[]): Promise<{ deleted: number; failed: number }> {
    let deleted = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        const existingEmployee = await prisma.employee.findFirst({
          where: { id, tenantId },
        });

        if (!existingEmployee) {
          failed++;
          continue;
        }

        // Check if employee has attendance records
        const attendanceCount = await prisma.attendance.count({
          where: { employeeId: id, tenantId },
        });

        if (attendanceCount > 0) {
          failed++;
          continue;
        }

        // Check if employee has payroll records
        const payrollCount = await prisma.payrollRecord.count({
          where: { employeeId: id },
        });

        if (payrollCount > 0) {
          failed++;
          continue;
        }

        await prisma.employee.delete({
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
