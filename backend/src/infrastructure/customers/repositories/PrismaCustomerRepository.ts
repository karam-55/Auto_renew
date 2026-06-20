import { CustomerRepository } from '../../../application/customers/interfaces/CustomerRepository';
import { Customer } from '../../../domain/customers/entities/Customer';
import { PhoneNumber } from '../../../domain/customers/value-objects/PhoneNumber';
import prisma from '../../../config/database';

export class PrismaCustomerRepository implements CustomerRepository {
  async findById(id: string): Promise<Customer | null> {
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      return null;
    }

    return this.mapToDomain(customer);
  }

  async findByPhoneAndTenantId(phone: PhoneNumber, tenantId: string): Promise<Customer | null> {
    const customer = await prisma.customer.findUnique({
      where: {
        tenantId_phone: {
          tenantId,
          phone: phone.getValue(),
        },
      },
    });

    if (!customer) {
      return null;
    }

    return this.mapToDomain(customer);
  }

  async findByTenantId(tenantId: string): Promise<Customer[]> {
    const customers = await prisma.customer.findMany({
      where: { tenantId },
    });

    return customers.map(c => this.mapToDomain(c));
  }

  async create(customer: Customer): Promise<Customer> {
    const createdCustomer = await prisma.customer.create({
      data: {
        id: customer.id,
        tenantId: customer.tenantId,
        fullName: customer.fullName,
        phone: customer.phone.getValue(),
        address: customer.address,
        notes: customer.notes,
        city: customer.city,
        isVip: customer.isVip,
        loyaltyPoints: customer.loyaltyPoints,
        isActive: customer.isActive,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      },
    });

    return this.mapToDomain(createdCustomer);
  }

  async update(customer: Customer): Promise<Customer> {
    const updatedCustomer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        fullName: customer.fullName,
        phone: customer.phone.getValue(),
        address: customer.address,
        notes: customer.notes,
        city: customer.city,
        isVip: customer.isVip,
        loyaltyPoints: customer.loyaltyPoints,
        isActive: customer.isActive,
        updatedAt: customer.updatedAt,
      },
    });

    return this.mapToDomain(updatedCustomer);
  }

  async delete(id: string): Promise<void> {
    await prisma.customer.delete({
      where: { id },
    });
  }

  async addLoyaltyPoints(customerId: string, points: number): Promise<void> {
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        loyaltyPoints: {
          increment: points,
        },
      },
    });
  }

  private mapToDomain(prismaCustomer: any): Customer {
    const phone = new PhoneNumber(prismaCustomer.phone);

    return new Customer(
      prismaCustomer.id,
      phone,
      prismaCustomer.fullName,
      prismaCustomer.tenantId,
      prismaCustomer.address,
      prismaCustomer.notes,
      prismaCustomer.city,
      prismaCustomer.isVip,
      prismaCustomer.loyaltyPoints,
      prismaCustomer.isActive,
      prismaCustomer.createdAt,
      prismaCustomer.updatedAt
    );
  }
}
