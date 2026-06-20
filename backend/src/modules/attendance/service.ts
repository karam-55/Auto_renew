import prisma from '../../config/database';
import { CreateAttendanceInput, UpdateAttendanceInput, AttendanceResponse } from './types';

export class AttendanceService {
  async getAllAttendance(tenantId: string, page: number = 1, limit: number = 50): Promise<{ attendance: AttendanceResponse[], total: number }> {
    const skip = (page - 1) * limit;

    const [attendance, total] = await Promise.all([
      prisma.attendance.findMany({
        where: { tenantId },
        select: {
          id: true,
          tenantId: true,
          employeeId: true,
          date: true,
          checkIn: true,
          checkOut: true,
          hoursWorked: true,
          shiftId: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.attendance.count({ where: { tenantId } }),
    ]);

    return {
      attendance: attendance.map(a => ({
        ...a,
        hoursWorked: a.hoursWorked ? Number(a.hoursWorked) : null,
      })),
      total,
    };
  }

  async getAttendanceById(tenantId: string, attendanceId: string): Promise<AttendanceResponse | null> {
    const attendance = await prisma.attendance.findFirst({
      where: { id: attendanceId, tenantId },
      select: {
        id: true,
        tenantId: true,
        employeeId: true,
        date: true,
        checkIn: true,
        checkOut: true,
        hoursWorked: true,
        shiftId: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!attendance) return null;
    return {
      ...attendance,
      hoursWorked: attendance.hoursWorked ? Number(attendance.hoursWorked) : null,
    };
  }

  async getAttendanceByEmployee(tenantId: string, employeeId: string, startDate?: Date, endDate?: Date): Promise<AttendanceResponse[]> {
    const where: any = { tenantId, employeeId };
    
    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const attendance = await prisma.attendance.findMany({
      where,
      select: {
        id: true,
        tenantId: true,
        employeeId: true,
        date: true,
        checkIn: true,
        checkOut: true,
        hoursWorked: true,
        shiftId: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { date: 'desc' },
    });

    return attendance.map(a => ({
      ...a,
      hoursWorked: a.hoursWorked ? Number(a.hoursWorked) : null,
    }));
  }

  async getAttendanceByDate(tenantId: string, date: Date): Promise<AttendanceResponse[]> {
    const attendance = await prisma.attendance.findMany({
      where: { tenantId, date },
      select: {
        id: true,
        tenantId: true,
        employeeId: true,
        date: true,
        checkIn: true,
        checkOut: true,
        hoursWorked: true,
        shiftId: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { checkIn: 'asc' },
    });

    return attendance.map(a => ({
      ...a,
      hoursWorked: a.hoursWorked ? Number(a.hoursWorked) : null,
    }));
  }

  async createAttendance(tenantId: string, data: CreateAttendanceInput): Promise<AttendanceResponse> {
    // Verify employee exists and belongs to tenant
    const employee = await prisma.employee.findFirst({
      where: { id: data.employeeId, tenantId },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Check if attendance already exists for this employee on this date
    const existingAttendance = await prisma.attendance.findFirst({
      where: { employeeId: data.employeeId, date: data.date },
    });

    if (existingAttendance) {
      throw new Error('Attendance already exists for this employee on this date');
    }

    // If shiftId is provided, verify it exists
    if (data.shiftId) {
      const shift = await prisma.shift.findFirst({
        where: { id: data.shiftId },
      });

      if (!shift) {
        throw new Error('Shift not found');
      }
    }

    // Calculate hours worked if both checkIn and checkOut are provided
    let hoursWorked = null;
    let isLate = false;
    let overtimeHours = 0;

    if (data.checkIn && data.checkOut) {
      // Validate check-out is after check-in
      if (data.checkOut <= data.checkIn) {
        throw new Error('Check-out time must be after check-in time');
      }
      const diffMs = data.checkOut.getTime() - data.checkIn.getTime();
      hoursWorked = diffMs / (1000 * 60 * 60); // Convert to hours

      // Check if late (assuming 9:00 AM as standard start time)
      const standardStartTime = new Date(data.checkIn);
      standardStartTime.setHours(9, 0, 0, 0);
      if (data.checkIn > standardStartTime) {
        isLate = true;
      }

      // Calculate overtime (hours > 8)
      if (hoursWorked > 8) {
        overtimeHours = hoursWorked - 8;
      }
    }

    const attendance = await prisma.attendance.create({
      data: {
        tenantId,
        employeeId: data.employeeId,
        date: data.date,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        shiftId: data.shiftId,
        notes: data.notes,
        hoursWorked,
      },
      select: {
        id: true,
        tenantId: true,
        employeeId: true,
        date: true,
        checkIn: true,
        checkOut: true,
        hoursWorked: true,
        shiftId: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      ...attendance,
      hoursWorked: attendance.hoursWorked ? Number(attendance.hoursWorked) : null,
    };
  }

  async updateAttendance(tenantId: string, attendanceId: string, data: UpdateAttendanceInput): Promise<AttendanceResponse> {
    // Check if attendance exists and belongs to tenant
    const existingAttendance = await prisma.attendance.findFirst({
      where: { id: attendanceId, tenantId },
    });

    if (!existingAttendance) {
      throw new Error('Attendance not found');
    }

    // If shiftId is provided, verify it exists
    if (data.shiftId) {
      const shift = await prisma.shift.findFirst({
        where: { id: data.shiftId },
      });

      if (!shift) {
        throw new Error('Shift not found');
      }
    }

    // Calculate hours worked if both checkIn and checkOut are provided
    let hoursWorked = undefined;
    const checkIn = data.checkIn ?? existingAttendance.checkIn;
    const checkOut = data.checkOut ?? existingAttendance.checkOut;

    if (checkIn && checkOut) {
      const diffMs = checkOut.getTime() - checkIn.getTime();
      hoursWorked = diffMs / (1000 * 60 * 60); // Convert to hours
    }

    const attendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        shiftId: data.shiftId,
        notes: data.notes,
        hoursWorked,
      },
      select: {
        id: true,
        tenantId: true,
        employeeId: true,
        date: true,
        checkIn: true,
        checkOut: true,
        hoursWorked: true,
        shiftId: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      ...attendance,
      hoursWorked: attendance.hoursWorked ? Number(attendance.hoursWorked) : null,
    };
  }

  async deleteAttendance(tenantId: string, attendanceId: string): Promise<void> {
    // Check if attendance exists and belongs to tenant
    const existingAttendance = await prisma.attendance.findFirst({
      where: { id: attendanceId, tenantId },
    });

    if (!existingAttendance) {
      throw new Error('Attendance not found');
    }

    await prisma.attendance.delete({
      where: { id: attendanceId },
    });
  }

  async checkIn(tenantId: string, employeeId: string, checkInTime: Date, shiftId?: string): Promise<AttendanceResponse> {
    // Verify employee exists and belongs to tenant
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Check if attendance already exists for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: today,
          lte: endOfDay,
        },
      },
    });

    if (existingAttendance) {
      throw new Error('Employee already checked in today');
    }

    // If shiftId is provided, verify it exists
    if (shiftId) {
      const shift = await prisma.shift.findFirst({
        where: { id: shiftId },
      });

      if (!shift) {
        throw new Error('Shift not found');
      }
    }

    const attendance = await prisma.attendance.create({
      data: {
        tenantId,
        employeeId,
        date: today,
        checkIn: checkInTime,
        shiftId,
      },
      select: {
        id: true,
        tenantId: true,
        employeeId: true,
        date: true,
        checkIn: true,
        checkOut: true,
        hoursWorked: true,
        shiftId: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      ...attendance,
      hoursWorked: attendance.hoursWorked ? Number(attendance.hoursWorked) : null,
    };
  }

  async checkOut(tenantId: string, attendanceId: string, checkOutTime: Date): Promise<AttendanceResponse> {
    // Check if attendance exists and belongs to tenant
    const existingAttendance = await prisma.attendance.findFirst({
      where: { id: attendanceId, tenantId },
    });

    if (!existingAttendance) {
      throw new Error('Attendance not found');
    }

    if (existingAttendance.checkOut) {
      throw new Error('Employee already checked out');
    }

    if (!existingAttendance.checkIn) {
      throw new Error('Employee has not checked in');
    }

    // Calculate hours worked
    const diffMs = checkOutTime.getTime() - existingAttendance.checkIn.getTime();
    const hoursWorked = diffMs / (1000 * 60 * 60); // Convert to hours

    const attendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        checkOut: checkOutTime,
        hoursWorked,
      },
      select: {
        id: true,
        tenantId: true,
        employeeId: true,
        date: true,
        checkIn: true,
        checkOut: true,
        hoursWorked: true,
        shiftId: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      ...attendance,
      hoursWorked: attendance.hoursWorked ? Number(attendance.hoursWorked) : null,
    };
  }
}
