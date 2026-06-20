export interface CreateDepartmentInput {
  nameAr: string;
  nameEn?: string;
  description?: string;
  managerId?: string;
  isActive?: boolean;
  hasFixedSalary?: boolean;
  fixedMonthlySalarySYP?: number;
  fixedMonthlySalaryUSD?: number;
  workHoursPerMonth?: number;
}

export interface UpdateDepartmentInput {
  nameAr?: string;
  nameEn?: string;
  description?: string;
  managerId?: string;
  isActive?: boolean;
  hasFixedSalary?: boolean;
  fixedMonthlySalarySYP?: number;
  fixedMonthlySalaryUSD?: number;
  workHoursPerMonth?: number;
}

export interface DepartmentResponse {
  id: string;
  tenantId: string;
  nameAr: string;
  nameEn?: string | null;
  description?: string | null;
  managerId?: string | null;
  isActive: boolean;
  hasFixedSalary: boolean;
  fixedMonthlySalarySYP?: number | null;
  fixedMonthlySalaryUSD?: number | null;
  workHoursPerMonth?: number | null;
  calculatedHourlyRateSYP?: number | null;
  createdAt: Date;
  updatedAt: Date;
}
