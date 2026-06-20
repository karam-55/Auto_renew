import { SupplierStatus as PrismaSupplierStatus } from '@prisma/client';

export type SupplierStatus = PrismaSupplierStatus;

export interface CreateSupplierDto {
  name: string;
  phone: string;
  address?: string;
  contactPerson?: string;
  contactPhone?: string;
  taxId?: string;
  paymentTerms?: string;
  creditLimit?: number;
  notes?: string;
  isActive?: boolean;
}

export interface UpdateSupplierDto {
  name?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  contactPhone?: string;
  taxId?: string;
  paymentTerms?: string;
  creditLimit?: number;
  balance?: number;
  status?: SupplierStatus;
  isActive?: boolean;
  notes?: string;
}

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  address: string | null;
  contactPerson: string | null;
  contactPhone: string | null;
  taxId: string | null;
  paymentTerms: string | null;
  creditLimit: number | null;
  balance: number;
  status: SupplierStatus;
  isActive: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
