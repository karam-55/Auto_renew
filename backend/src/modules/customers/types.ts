export interface CreateCustomerInput {
  fullName: string;
  phone: string;
  address?: string;
  city?: string;
  notes?: string;
  loyaltyPoints?: number;
  isVip?: boolean;
}

export interface UpdateCustomerInput {
  fullName?: string;
  phone?: string;
  address?: string;
  city?: string;
  notes?: string;
  loyaltyPoints?: number;
  isVip?: boolean;
}

export interface CustomerResponse {
  id: string;
  tenantId: string;
  fullName: string;
  phone: string;
  address?: string | null;
  city?: string | null;
  notes?: string | null;
  loyaltyPoints: number;
  isVip: boolean;
  createdAt: Date;
  updatedAt: Date;
}
