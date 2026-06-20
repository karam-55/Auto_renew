export interface CreateAttendanceInput {
  employeeId: string;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  shiftId?: string;
  notes?: string;
}

export interface UpdateAttendanceInput {
  checkIn?: Date;
  checkOut?: Date;
  shiftId?: string;
  notes?: string;
}

export interface AttendanceResponse {
  id: string;
  tenantId: string;
  employeeId: string;
  date: Date;
  checkIn?: Date | null;
  checkOut?: Date | null;
  hoursWorked?: number | null;
  shiftId?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
