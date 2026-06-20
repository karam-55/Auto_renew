import prisma from '../../config/database';
import { CreateSupplierDto, UpdateSupplierDto, Supplier } from './types';
import { SupplierStatus } from '@prisma/client';

export class SupplierService {
  async createSupplier(tenantId: string, data: CreateSupplierDto): Promise<Supplier> {
    // Check if phone already exists in this tenant
    const existingSupplier = await prisma.supplier.findFirst({
      where: { tenantId, phone: data.phone },
    });

    if (existingSupplier) {
      throw new Error('Supplier with this phone number already exists');
    }

    const supplier = await prisma.supplier.create({
      data: {
        tenantId,
        name: data.name,
        phone: data.phone,
        address: data.address,
        contactPerson: data.contactPerson,
        contactPhone: data.contactPhone,
        taxId: data.taxId,
        paymentTerms: data.paymentTerms,
        creditLimit: data.creditLimit ? data.creditLimit.toString() : null,
        balance: '0',
        status: SupplierStatus.ACTIVE,
        notes: data.notes,
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        phone: true,
        address: true,
        contactPerson: true,
        contactPhone: true,
        taxId: true,
        paymentTerms: true,
        creditLimit: true,
        balance: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        isActive: true,
      },
    });

    return {
      ...supplier,
      creditLimit: supplier.creditLimit ? Number(supplier.creditLimit) : null,
      balance: Number(supplier.balance),
    };
  }

  async getSuppliers(tenantId: string, filters?: { status?: SupplierStatus }, skip?: number, limit?: number): Promise<Supplier[]> {
    const suppliers = await prisma.supplier.findMany({
      where: {
        tenantId,
        ...(filters?.status ? { status: filters.status } : {}),
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        phone: true,
        address: true,
        contactPerson: true,
        contactPhone: true,
        taxId: true,
        paymentTerms: true,
        creditLimit: true,
        balance: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: skip || undefined,
      take: limit || undefined,
    });

    return suppliers.map(supplier => ({
      ...supplier,
      creditLimit: supplier.creditLimit ? Number(supplier.creditLimit) : null,
      balance: Number(supplier.balance),
    }));
  }

  async getSuppliersCount(tenantId: string, filters?: { status?: SupplierStatus }): Promise<number> {
    return prisma.supplier.count({
      where: {
        tenantId,
        ...(filters?.status ? { status: filters.status } : {}),
      },
    });
  }

  async getSupplierById(id: string, tenantId: string): Promise<Supplier | null> {
    const supplier = await prisma.supplier.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        tenantId: true,
        name: true,
        phone: true,
        address: true,
        contactPerson: true,
        contactPhone: true,
        taxId: true,
        paymentTerms: true,
        creditLimit: true,
        balance: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        isActive: true,
      },
    });

    if (!supplier) {
      return null;
    }

    return {
      ...supplier,
      creditLimit: supplier.creditLimit ? Number(supplier.creditLimit) : null,
      balance: Number(supplier.balance),
    };
  }

  async updateSupplier(id: string, tenantId: string, data: UpdateSupplierDto): Promise<Supplier> {
    // Check if supplier exists and belongs to tenant
    const existingSupplier = await prisma.supplier.findFirst({
      where: { id, tenantId },
    });

    if (!existingSupplier) {
      throw new Error('Supplier not found');
    }

    // If updating phone, check if new phone is available
    if (data.phone && data.phone !== existingSupplier.phone) {
      const phoneExists = await prisma.supplier.findFirst({
        where: { tenantId, phone: data.phone },
      });

      if (phoneExists) {
        throw new Error('Supplier with this phone number already exists');
      }
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        address: data.address,
        contactPerson: data.contactPerson,
        contactPhone: data.contactPhone,
        taxId: data.taxId,
        paymentTerms: data.paymentTerms,
        creditLimit: data.creditLimit !== undefined ? data.creditLimit.toString() : undefined,
        balance: data.balance !== undefined ? data.balance.toString() : undefined,
        status: data.status,
        notes: data.notes,
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        phone: true,
        address: true,
        contactPerson: true,
        contactPhone: true,
        taxId: true,
        paymentTerms: true,
        creditLimit: true,
        balance: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        isActive: true,
      },
    });

    return {
      ...supplier,
      creditLimit: supplier.creditLimit ? Number(supplier.creditLimit) : null,
      balance: Number(supplier.balance),
    };
  }

  async deleteSupplier(id: string, tenantId: string): Promise<void> {
    // Check if supplier exists and belongs to tenant
    const existingSupplier = await prisma.supplier.findFirst({
      where: { id, tenantId },
    });

    if (!existingSupplier) {
      throw new Error('Supplier not found');
    }

    // Check if supplier has any parts
    const partsCount = await prisma.part.count({
      where: { supplierId: id, tenantId },
    });

    if (partsCount > 0) {
      throw new Error('Cannot delete supplier with existing parts');
    }

    // Check if supplier has any purchase orders
    const purchaseOrdersCount = await prisma.purchaseOrder.count({
      where: { supplierId: id, tenantId },
    });

    if (purchaseOrdersCount > 0) {
      throw new Error('Cannot delete supplier with existing purchase orders');
    }

    await prisma.supplier.delete({
      where: { id },
    });
  }

  async searchSuppliers(tenantId: string, query: string): Promise<Supplier[]> {
    const suppliers = await prisma.supplier.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
          { contactPerson: { contains: query, mode: 'insensitive' } },
          { contactPhone: { contains: query } },
          { taxId: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        phone: true,
        address: true,
        contactPerson: true,
        contactPhone: true,
        taxId: true,
        paymentTerms: true,
        creditLimit: true,
        balance: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return suppliers.map(supplier => ({
      ...supplier,
      creditLimit: supplier.creditLimit ? Number(supplier.creditLimit) : null,
      balance: Number(supplier.balance),
    }));
  }
}
