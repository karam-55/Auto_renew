export interface CreateEmployeeInput {
  userId?: string;
  employeeCode: string;
  fullNameAr: string;
  fullNameEn?: string;
  position: string;
  departmentId: string;
  hireDate: Date;
  salarySYP: number;
  salaryUSD?: number;
  hourlyRate?: number;
  contractType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'TEMPORARY';
  status?: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  phone: string;
  address?: string;
  emergencyContact?: string;
  idNumber?: string;
}

export interface UpdateEmployeeInput {
  userId?: string;
  employeeCode?: string;
  fullNameAr?: string;
  fullNameEn?: string;
  position?: string;
  departmentId?: string;
  hireDate?: Date;
  salarySYP?: number;
  salaryUSD?: number;
  hourlyRate?: number;
  contractType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'TEMPORARY';
  status?: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  phone?: string;
  address?: string;
  emergencyContact?: string;
  idNumber?: string;
}

export interface EmployeeResponse {
  id: string;
  tenantId: string;
  userId?: string | null;
  employeeCode: string;
  fullNameAr: string;
  fullNameEn?: string | null;
  position: string;
  departmentId: string;
  hireDate: Date;
  salarySYP: number;
  salaryUSD?: number | null;
  hourlyRate?: number | null;
  contractType: string;
  status: string;
  phone: string;
  address?: string | null;
  emergencyContact?: string | null;
  idNumber?: string | null;
  departmentHasFixedSalary?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
