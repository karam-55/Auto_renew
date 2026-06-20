export interface CreateShiftInput {
  nameAr: string;
  nameEn?: string;
  startTime: string;
  endTime: string;
  isActive?: boolean;
}

export interface UpdateShiftInput {
  nameAr?: string;
  nameEn?: string;
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
}

export interface ShiftResponse {
  id: string;
  tenantId: string;
  nameAr: string;
  nameEn?: string | null;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
