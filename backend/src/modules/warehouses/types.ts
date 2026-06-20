import { WarehouseStatus } from '@prisma/client';

export interface CreateWarehouseDto {
  name: string;
  code: string;
  address?: string;
  phone: string;
  managerId?: string;
  capacity?: number;
  status?: WarehouseStatus;
}

export interface UpdateWarehouseDto {
  name?: string;
  code?: string;
  address?: string;
  phone?: string;
  managerId?: string;
  capacity?: number;
  status?: WarehouseStatus;
}

export interface Warehouse {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  address?: string | null;
  phone: string;
  managerId?: string | null;
  capacity?: number | null;
  status: WarehouseStatus;
  createdAt: Date;
  updatedAt: Date;
}
