import { CustomerRepository as ICustomerRepository } from '../../../application/customers/interfaces/CustomerRepository';
import { Customer } from '../../../domain/customers/entities/Customer';
import { PhoneNumber } from '../../../domain/customers/value-objects/PhoneNumber';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundError } from '../../errors/not-found-error';
import { DatabaseError } from '../../errors/database-error';

export class CustomerRepository implements ICustomerRepository {
  async findById(id: string): Promise<Customer | null> {
    try {
      const prisma = PrismaService.getInstance();
      const customer = await prisma.customer.findUnique({
        where: { id },
      });
      if (!customer) return null;
      return this.mapToDomain(customer);
    } catch (error) {
      throw new DatabaseError('Failed to find customer by id', error);
    }
  }

  async findByPhoneAndTenantId(phone: PhoneNumber, tenantId: string): Promise<Customer | null> {
    try {
      const prisma = PrismaService.getInstance();
      const customer = await prisma.customer.findUnique({
        where: {
          tenantId_phone: {
            tenantId,
            phone: phone.getValue(),
          },
        },
      });
      if (!customer) return null;
      return this.mapToDomain(customer);
    } catch (error) {
      throw new DatabaseError('Failed to find customer by phone and tenant', error);
    }
  }

  async findByTenantId(tenantId: string): Promise<Customer[]> {
    try {
      const prisma = PrismaService.getInstance();
      const customers = await prisma.customer.findMany({
        where: { tenantId },
      });
      return customers.map(c => this.mapToDomain(c));
    } catch (error) {
      throw new DatabaseError('Failed to find customers by tenant', error);
    }
  }

  async create(customer: Customer): Promise<Customer> {
    try {
      const prisma = PrismaService.getInstance();
      const created = await prisma.customer.create({
        data: {
          id: customer.id,
          tenantId: customer.tenantId,
          fullName: customer.fullName,
          phone: customer.phone.getValue(),
          address: customer.address,
          notes: customer.notes,
          isActive: customer.isActive,
          city: customer.city,
          isVip: customer.isVip,
          loyaltyPoints: customer.loyaltyPoints,
        },
      });
      return this.mapToDomain(created);
    } catch (error) {
      throw new DatabaseError('Failed to create customer', error);
    }
  }

  async update(customer: Customer): Promise<Customer> {
    try {
      const prisma = PrismaService.getInstance();
      const updated = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          fullName: customer.fullName,
          phone: customer.phone.getValue(),
          address: customer.address,
          notes: customer.notes,
          isActive: customer.isActive,
          city: customer.city,
          isVip: customer.isVip,
          loyaltyPoints: customer.loyaltyPoints,
        },
      });
      return this.mapToDomain(updated);
    } catch (error) {
      throw new DatabaseError('Failed to update customer', error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const prisma = PrismaService.getInstance();
      await prisma.customer.delete({
        where: { id },
      });
    } catch (error) {
      throw new DatabaseError('Failed to delete customer', error);
    }
  }

  async addLoyaltyPoints(customerId: string, points: number): Promise<void> {
    try {
      const prisma = PrismaService.getInstance();
      await prisma.customer.update({
        where: { id: customerId },
        data: {
          loyaltyPoints: {
            increment: points,
          },
        },
      });
    } catch (error) {
      throw new DatabaseError('Failed to add loyalty points', error);
    }
  }

  private mapToDomain(data: any): Customer {
    return new Customer(
      data.id,
      new PhoneNumber(data.phone),
      data.fullName,
      data.tenantId,
      data.address,
      data.notes,
      data.city,
      data.isVip,
      data.loyaltyPoints,
      data.isActive,
      data.createdAt,
      data.updatedAt
    );
  }
}
