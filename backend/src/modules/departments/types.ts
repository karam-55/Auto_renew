export interface CreateDepartmentInput {
  nameAr: string;
  nameEn?: string;
  description?: string;
  managerId?: string;
  isActive?: boolean;
}

export interface UpdateDepartmentInput {
  nameAr?: string;
  nameEn?: string;
  description?: string;
  managerId?: string;
  isActive?: boolean;
}

export interface DepartmentResponse {
  id: string;
  tenantId: string;
  nameAr: string;
  nameEn?: string | null;
  description?: string | null;
  managerId?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
