// ============================================
// PREVENTIVE MAINTENANCE TYPES
// ============================================

export interface PreventiveMaintenanceTemplate {
  id: string;
  tenantId: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  intervalKm: number;
  intervalMonths?: number;
  priorityKm: number;
  priorityMonths?: number;
  maxDelayKm?: number;
  maxDelayMonths?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePreventiveMaintenanceTemplateInput {
  name: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  intervalKm: number;
  intervalMonths?: number;
  priorityKm: number;
  priorityMonths?: number;
  maxDelayKm?: number;
  maxDelayMonths?: number;
  isActive?: boolean;
}

export interface UpdatePreventiveMaintenanceTemplateInput {
  name?: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  intervalKm?: number;
  intervalMonths?: number;
  priorityKm?: number;
  priorityMonths?: number;
  maxDelayKm?: number;
  maxDelayMonths?: number;
  isActive?: boolean;
}

export interface PreventiveMaintenanceLog {
  id: string;
  tenantId: string;
  templateId: string;
  vehicleId: string;
  scheduledKm: number;
  scheduledDate: Date;
  actualKm?: number;
  actualDate?: Date;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED' | 'CANCELLED';
  isDelayed: boolean;
  delayReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePreventiveMaintenanceLogInput {
  templateId: string;
  vehicleId: string;
  scheduledKm: number;
  scheduledDate: Date;
  notes?: string;
}

export interface UpdatePreventiveMaintenanceLogInput {
  actualKm?: number;
  actualDate?: Date;
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED' | 'CANCELLED';
  isDelayed?: boolean;
  delayReason?: string;
  notes?: string;
}

export interface MaintenanceReminder {
  logId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  vehicleId: string;
  vehicleMake: string;
  vehicleModel: string;
  templateName: string;
  scheduledKm: number;
  scheduledDate: string;
  garageName: string;
}

export interface MaintenanceFilters {
  customerId?: string;
  vehicleId?: string;
  templateId?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
