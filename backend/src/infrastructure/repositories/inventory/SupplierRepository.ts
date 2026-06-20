import { ISupplierRepository } from '../../../application/inventory/interfaces/ISupplierRepository';
import { PrismaService } from '../../database/prisma.service';
import { DatabaseError } from '../../errors/database-error';

export class SupplierRepository implements ISupplierRepository {
  async findById(id: string): Promise<any | null> {
    try {
      const prisma = PrismaService.getInstance();
      const supplier = await prisma.supplier.findUnique({
        where: { id },
      });
      return supplier;
    } catch (error) {
      throw new DatabaseError('Failed to find supplier by id', error);
    }
  }

  async save(supplier: any): Promise<any> {
    try {
      const prisma = PrismaService.getInstance();
      const created = await prisma.supplier.create({
        data: {
          id: supplier.id,
          tenantId: supplier.tenantId,
          name: supplier.name,
          phone: supplier.phone,
          address: supplier.address,
          contactPerson: supplier.contactPerson,
          contactPhone: supplier.contactPhone,
          creditLimit: supplier.creditLimit,
          notes: supplier.notes,
          paymentTerms: supplier.paymentTerms,
          status: supplier.status,
          taxId: supplier.taxId,
        },
      });
      return created;
    } catch (error) {
      throw new DatabaseError('Failed to save supplier', error);
    }
  }

  async update(supplier: any): Promise<any> {
    try {
      const prisma = PrismaService.getInstance();
      const updated = await prisma.supplier.update({
        where: { id: supplier.id },
        data: {
          name: supplier.name,
          phone: supplier.phone,
          address: supplier.address,
          contactPerson: supplier.contactPerson,
          contactPhone: supplier.contactPhone,
          creditLimit: supplier.creditLimit,
          notes: supplier.notes,
          paymentTerms: supplier.paymentTerms,
          status: supplier.status,
          taxId: supplier.taxId,
          balance: supplier.balance,
        },
      });
      return updated;
    } catch (error) {
      throw new DatabaseError('Failed to update supplier', error);
    }
  }

  async list(tenantId: string): Promise<any[]> {
    try {
      const prisma = PrismaService.getInstance();
      const suppliers = await prisma.supplier.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
      });
      return suppliers;
    } catch (error) {
      throw new DatabaseError('Failed to list suppliers', error);
    }
  }
}
