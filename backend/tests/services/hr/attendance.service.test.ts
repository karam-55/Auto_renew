import { AttendanceService } from '../../../src/modules/attendance/service';
import prisma from '../../../src/config/database';

// Mock Prisma
jest.mock('../../../src/config/database', () => ({
  __esModule: true,
  default: {
    attendance: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    employee: {
      findFirst: jest.fn(),
    },
    shift: {
      findFirst: jest.fn(),
    },
  },
}));

describe('AttendanceService', () => {
  let attendanceService: AttendanceService;
  const mockTenantId = 'tenant-123';

  beforeEach(() => {
    attendanceService = new AttendanceService();
    jest.clearAllMocks();
  });

  describe('getAllAttendance', () => {
    it('should return all attendance records for a tenant', async () => {
      const mockAttendance = [
        {
          id: 'att-1',
          tenantId: mockTenantId,
          employeeId: 'emp-1',
          date: new Date('2024-05-26'),
          checkIn: new Date('2024-05-26T08:00:00'),
          checkOut: new Date('2024-05-26T17:00:00'),
          hoursWorked: 9,
          shiftId: 'shift-1',
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.attendance.findMany as jest.Mock).mockResolvedValue(mockAttendance);

      const result = await attendanceService.getAllAttendance(mockTenantId);

      expect(prisma.attendance.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
        select: expect.any(Object),
        orderBy: { date: 'desc' },
      });
      expect(result).toEqual(
        mockAttendance.map(a => ({
          ...a,
          hoursWorked: a.hoursWorked ? Number(a.hoursWorked) : null,
        }))
      );
    });
  });

  describe('getAttendanceById', () => {
    it('should return attendance by ID', async () => {
      const mockAttendance = {
        id: 'att-1',
        tenantId: mockTenantId,
        employeeId: 'emp-1',
        date: new Date('2024-05-26'),
        checkIn: new Date('2024-05-26T08:00:00'),
        checkOut: new Date('2024-05-26T17:00:00'),
        hoursWorked: 9,
        shiftId: 'shift-1',
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue(mockAttendance);

      const result = await attendanceService.getAttendanceById(mockTenantId, 'att-1');

      expect(prisma.attendance.findFirst).toHaveBeenCalledWith({
        where: { id: 'att-1', tenantId: mockTenantId },
        select: expect.any(Object),
      });
      expect(result).not.toBeNull();
    });

    it('should return null if attendance not found', async () => {
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await attendanceService.getAttendanceById(mockTenantId, 'non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getAttendanceByEmployee', () => {
    it('should return attendance for a specific employee', async () => {
      const mockAttendance = [
        {
          id: 'att-1',
          tenantId: mockTenantId,
          employeeId: 'emp-1',
          date: new Date('2024-05-26'),
          checkIn: new Date('2024-05-26T08:00:00'),
          checkOut: new Date('2024-05-26T17:00:00'),
          hoursWorked: 9,
          shiftId: 'shift-1',
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.attendance.findMany as jest.Mock).mockResolvedValue(mockAttendance);

      const result = await attendanceService.getAttendanceByEmployee(mockTenantId, 'emp-1');

      expect(prisma.attendance.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId, employeeId: 'emp-1' },
        select: expect.any(Object),
        orderBy: { date: 'desc' },
      });
      expect(result).toHaveLength(1);
    });

    it('should filter by date range when provided', async () => {
      const startDate = new Date('2024-05-01');
      const endDate = new Date('2024-05-31');

      (prisma.attendance.findMany as jest.Mock).mockResolvedValue([]);

      await attendanceService.getAttendanceByEmployee(mockTenantId, 'emp-1', startDate, endDate);

      expect(prisma.attendance.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          employeeId: 'emp-1',
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: expect.any(Object),
        orderBy: { date: 'desc' },
      });
    });
  });

  describe('getAttendanceByDate', () => {
    it('should return attendance for a specific date', async () => {
      const mockAttendance = [
        {
          id: 'att-1',
          tenantId: mockTenantId,
          employeeId: 'emp-1',
          date: new Date('2024-05-26'),
          checkIn: new Date('2024-05-26T08:00:00'),
          checkOut: new Date('2024-05-26T17:00:00'),
          hoursWorked: 9,
          shiftId: 'shift-1',
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.attendance.findMany as jest.Mock).mockResolvedValue(mockAttendance);

      const result = await attendanceService.getAttendanceByDate(mockTenantId, new Date('2024-05-26'));

      expect(prisma.attendance.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId, date: new Date('2024-05-26') },
        select: expect.any(Object),
        orderBy: { checkIn: 'asc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('createAttendance', () => {
    it('should create a new attendance record', async () => {
      const attendanceData = {
        employeeId: 'emp-1',
        date: new Date('2024-05-26'),
        checkIn: new Date('2024-05-26T08:00:00'),
        checkOut: new Date('2024-05-26T17:00:00'),
        shiftId: 'shift-1',
        notes: undefined,
      };

      const mockAttendance = {
        id: 'att-1',
        tenantId: mockTenantId,
        ...attendanceData,
        hoursWorked: 9,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.employee.findFirst as jest.Mock).mockResolvedValue({ id: 'emp-1' });
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.shift.findFirst as jest.Mock).mockResolvedValue({ id: 'shift-1' });
      (prisma.attendance.create as jest.Mock).mockResolvedValue(mockAttendance);

      const result = await attendanceService.createAttendance(mockTenantId, attendanceData);

      expect(prisma.attendance.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: mockTenantId,
          employeeId: attendanceData.employeeId,
          date: attendanceData.date,
        }),
        select: expect.any(Object),
      });
      expect(result).not.toBeNull();
    });

    it('should throw error if employee not found', async () => {
      const attendanceData = {
        employeeId: 'non-existent',
        date: new Date('2024-05-26'),
        checkIn: new Date('2024-05-26T08:00:00'),
      };

      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        attendanceService.createAttendance(mockTenantId, attendanceData)
      ).rejects.toThrow('Employee not found');
    });

    it('should throw error if attendance already exists for employee on date', async () => {
      const attendanceData = {
        employeeId: 'emp-1',
        date: new Date('2024-05-26'),
        checkIn: new Date('2024-05-26T08:00:00'),
      };

      (prisma.employee.findFirst as jest.Mock).mockResolvedValue({ id: 'emp-1' });
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue({ id: 'existing-attendance' });

      await expect(
        attendanceService.createAttendance(mockTenantId, attendanceData)
      ).rejects.toThrow('Attendance already exists for this employee on this date');
    });

    it('should calculate hours worked when both checkIn and checkOut provided', async () => {
      const attendanceData = {
        employeeId: 'emp-1',
        date: new Date('2024-05-26'),
        checkIn: new Date('2024-05-26T08:00:00'),
        checkOut: new Date('2024-05-26T17:00:00'),
      };

      const mockAttendance = {
        id: 'att-1',
        tenantId: mockTenantId,
        ...attendanceData,
        hoursWorked: 9,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.employee.findFirst as jest.Mock).mockResolvedValue({ id: 'emp-1' });
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.attendance.create as jest.Mock).mockResolvedValue(mockAttendance);

      await attendanceService.createAttendance(mockTenantId, attendanceData);

      expect(prisma.attendance.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          hoursWorked: 9,
        }),
        select: expect.any(Object),
      });
    });
  });

  describe('updateAttendance', () => {
    it('should update an existing attendance record', async () => {
      const existingAttendance = {
        id: 'att-1',
        tenantId: mockTenantId,
        employeeId: 'emp-1',
        date: new Date('2024-05-26'),
        checkIn: new Date('2024-05-26T08:00:00'),
        checkOut: new Date('2024-05-26T17:00:00'),
        hoursWorked: 9,
        shiftId: 'shift-1',
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateData = {
        checkOut: new Date('2024-05-26T18:00:00'),
        notes: 'Overtime',
      };

      const updatedAttendance = {
        ...existingAttendance,
        ...updateData,
        hoursWorked: 10,
      };

      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue(existingAttendance);
      (prisma.attendance.update as jest.Mock).mockResolvedValue(updatedAttendance);

      const result = await attendanceService.updateAttendance(mockTenantId, 'att-1', updateData);

      expect(prisma.attendance.update).toHaveBeenCalledWith({
        where: { id: 'att-1' },
        data: expect.objectContaining({
          checkOut: updateData.checkOut,
          notes: updateData.notes,
          hoursWorked: 10,
        }),
        select: expect.any(Object),
      });
      expect(result).not.toBeNull();
    });

    it('should throw error if attendance not found', async () => {
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        attendanceService.updateAttendance(mockTenantId, 'non-existent', { notes: 'test' })
      ).rejects.toThrow('Attendance not found');
    });
  });

  describe('deleteAttendance', () => {
    it('should delete an attendance record', async () => {
      const existingAttendance = {
        id: 'att-1',
        tenantId: mockTenantId,
        employeeId: 'emp-1',
        date: new Date('2024-05-26'),
        checkIn: new Date('2024-05-26T08:00:00'),
        checkOut: new Date('2024-05-26T17:00:00'),
        hoursWorked: 9,
        shiftId: 'shift-1',
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue(existingAttendance);
      (prisma.attendance.delete as jest.Mock).mockResolvedValue(existingAttendance);

      await attendanceService.deleteAttendance(mockTenantId, 'att-1');

      expect(prisma.attendance.delete).toHaveBeenCalledWith({
        where: { id: 'att-1' },
      });
    });

    it('should throw error if attendance not found', async () => {
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        attendanceService.deleteAttendance(mockTenantId, 'non-existent')
      ).rejects.toThrow('Attendance not found');
    });
  });

  describe('checkIn', () => {
    it('should check in an employee', async () => {
      const checkInTime = new Date('2024-05-26T08:00:00');

      const mockAttendance = {
        id: 'att-1',
        tenantId: mockTenantId,
        employeeId: 'emp-1',
        date: new Date('2024-05-26'),
        checkIn: checkInTime,
        checkOut: null,
        hoursWorked: null,
        shiftId: 'shift-1',
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.employee.findFirst as jest.Mock).mockResolvedValue({ id: 'emp-1' });
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.shift.findFirst as jest.Mock).mockResolvedValue({ id: 'shift-1' });
      (prisma.attendance.create as jest.Mock).mockResolvedValue(mockAttendance);

      const result = await attendanceService.checkIn(mockTenantId, 'emp-1', checkInTime, 'shift-1');

      expect(prisma.attendance.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: mockTenantId,
          employeeId: 'emp-1',
          checkIn: checkInTime,
          shiftId: 'shift-1',
        }),
        select: expect.any(Object),
      });
      expect(result).not.toBeNull();
    });

    it('should throw error if employee already checked in today', async () => {
      const checkInTime = new Date('2024-05-26T08:00:00');

      (prisma.employee.findFirst as jest.Mock).mockResolvedValue({ id: 'emp-1' });
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue({ id: 'existing-attendance' });

      await expect(
        attendanceService.checkIn(mockTenantId, 'emp-1', checkInTime)
      ).rejects.toThrow('Employee already checked in today');
    });
  });

  describe('checkOut', () => {
    it('should check out an employee', async () => {
      const existingAttendance = {
        id: 'att-1',
        tenantId: mockTenantId,
        employeeId: 'emp-1',
        date: new Date('2024-05-26'),
        checkIn: new Date('2024-05-26T08:00:00'),
        checkOut: null,
        hoursWorked: null,
        shiftId: 'shift-1',
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const checkOutTime = new Date('2024-05-26T17:00:00');

      const updatedAttendance = {
        ...existingAttendance,
        checkOut: checkOutTime,
        hoursWorked: 9,
      };

      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue(existingAttendance);
      (prisma.attendance.update as jest.Mock).mockResolvedValue(updatedAttendance);

      const result = await attendanceService.checkOut(mockTenantId, 'att-1', checkOutTime);

      expect(prisma.attendance.update).toHaveBeenCalledWith({
        where: { id: 'att-1' },
        data: expect.objectContaining({
          checkOut: checkOutTime,
          hoursWorked: 9,
        }),
        select: expect.any(Object),
      });
      expect(result).not.toBeNull();
    });

    it('should throw error if attendance not found', async () => {
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        attendanceService.checkOut(mockTenantId, 'non-existent', new Date())
      ).rejects.toThrow('Attendance not found');
    });

    it('should throw error if employee already checked out', async () => {
      const existingAttendance = {
        id: 'att-1',
        tenantId: mockTenantId,
        employeeId: 'emp-1',
        date: new Date('2024-05-26'),
        checkIn: new Date('2024-05-26T08:00:00'),
        checkOut: new Date('2024-05-26T17:00:00'),
        hoursWorked: 9,
        shiftId: 'shift-1',
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue(existingAttendance);

      await expect(
        attendanceService.checkOut(mockTenantId, 'att-1', new Date())
      ).rejects.toThrow('Employee already checked out');
    });

    it('should throw error if employee has not checked in', async () => {
      const existingAttendance = {
        id: 'att-1',
        tenantId: mockTenantId,
        employeeId: 'emp-1',
        date: new Date('2024-05-26'),
        checkIn: null,
        checkOut: null,
        hoursWorked: null,
        shiftId: 'shift-1',
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue(existingAttendance);

      await expect(
        attendanceService.checkOut(mockTenantId, 'att-1', new Date())
      ).rejects.toThrow('Employee has not checked in');
    });
  });
});
