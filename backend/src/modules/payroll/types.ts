export interface CreatePayrollRecordInput {
  employeeId: string;
  periodStart: Date;
  periodEnd: Date;
  basicSalarySYP: number;
  basicSalaryUSD?: number;
  overtimeSYP?: number;
  overtimeUSD?: number;
  bonusesSYP?: number;
  bonusesUSD?: number;
  deductionsSYP?: number;
  deductionsUSD?: number;
  netSalarySYP: number;
  netSalaryUSD?: number;
  status?: 'DRAFT' | 'APPROVED' | 'PAID' | 'CANCELLED';
  notes?: string;
}

export interface UpdatePayrollRecordInput {
  basicSalarySYP?: number;
  basicSalaryUSD?: number;
  overtimeSYP?: number;
  overtimeUSD?: number;
  bonusesSYP?: number;
  bonusesUSD?: number;
  deductionsSYP?: number;
  deductionsUSD?: number;
  netSalarySYP?: number;
  netSalaryUSD?: number;
  status?: 'DRAFT' | 'APPROVED' | 'PAID' | 'CANCELLED';
  paidAt?: Date;
  notes?: string;
}

export interface PayrollRecordResponse {
  id: string;
  tenantId: string;
  employeeId: string;
  periodStart: Date;
  periodEnd: Date;
  basicSalarySYP: number;
  basicSalaryUSD?: number | null;
  overtimeSYP: number;
  overtimeUSD?: number | null;
  bonusesSYP: number;
  bonusesUSD?: number | null;
  deductionsSYP: number;
  deductionsUSD?: number | null;
  netSalarySYP: number;
  netSalaryUSD?: number | null;
  status: string;
  paidAt?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
