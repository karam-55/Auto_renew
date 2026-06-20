import { Request, Response } from 'express';
import { Logger } from '../../../infrastructure/logging/logger';
import { CreateCustomer } from '../../../application/customers/use-cases/CreateCustomer';
import { UpdateCustomer } from '../../../application/customers/use-cases/UpdateCustomer';
import { GetCustomer } from '../../../application/customers/use-cases/GetCustomer';
import { ListCustomers } from '../../../application/customers/use-cases/ListCustomers';
import { DeleteCustomer } from '../../../application/customers/use-cases/DeleteCustomer';
import { PrismaCustomerRepository } from '../../../infrastructure/customers/repositories/PrismaCustomerRepository';
import prisma from '../../../config/database';

export class CustomerController {
  private createCustomer: CreateCustomer;
  private updateCustomer: UpdateCustomer;
  private getCustomer: GetCustomer;
  private listCustomers: ListCustomers;
  private deleteCustomer: DeleteCustomer;

  constructor() {
    const customerRepository = new PrismaCustomerRepository();
    this.createCustomer = new CreateCustomer(customerRepository);
    this.updateCustomer = new UpdateCustomer(customerRepository);
    this.getCustomer = new GetCustomer(customerRepository);
    this.listCustomers = new ListCustomers(customerRepository);
    this.deleteCustomer = new DeleteCustomer(customerRepository);
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, fullName, phone, address, notes, city } = req.body;

      const result = await this.createCustomer.execute(
        tenantId,
        fullName,
        phone,
        address,
        notes,
        city
      );

      res.status(201).json({
        id: result.customer.id,
        tenantId: result.customer.tenantId,
        fullName: result.customer.fullName,
        phone: result.customer.phone.getValue(),
        address: result.customer.address,
        notes: result.customer.notes,
        city: result.customer.city,
        isVip: result.customer.isVip,
        loyaltyPoints: result.customer.loyaltyPoints,
        isActive: result.customer.isActive,
        createdAt: result.customer.createdAt,
        updatedAt: result.customer.updatedAt,
      });
    } catch (error) {
      Logger.error('Create customer error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to create customer';
      
      if (errorMessage === 'Customer with this phone number already exists') {
        res.status(400).json({ error: errorMessage });
        return;
      }
      
      res.status(500).json({ error: 'Failed to create customer' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { fullName, phone, address, notes, city, isVip } = req.body;

      const customer = await this.updateCustomer.execute(
        id,
        fullName,
        phone,
        address,
        notes,
        city,
        isVip
      );

      res.json({
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
      });
    } catch (error) {
      Logger.error('Update customer error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to update customer';
      
      if (errorMessage === 'Customer not found') {
        res.status(404).json({ error: errorMessage });
        return;
      }
      
      res.status(500).json({ error: 'Failed to update customer' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const customer = await this.getCustomer.execute(id);

      res.json({
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
      });
    } catch (error) {
      Logger.error('Get customer error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to get customer';
      
      if (errorMessage === 'Customer not found') {
        res.status(404).json({ error: errorMessage });
        return;
      }
      
      res.status(500).json({ error: 'Failed to get customer' });
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.query;

      if (!tenantId || typeof tenantId !== 'string') {
        res.status(400).json({ error: 'Tenant ID is required' });
        return;
      }

      const customers = await this.listCustomers.execute(tenantId);

      res.json(
        customers.map(customer => ({
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
        }))
      );
    } catch (error) {
      Logger.error('List customers error:', error);
      res.status(500).json({ error: 'Failed to list customers' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await this.deleteCustomer.execute(id);

      res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
      Logger.error('Delete customer error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete customer';
      
      if (errorMessage === 'Customer not found') {
        res.status(404).json({ error: errorMessage });
        return;
      }
      
      res.status(500).json({ error: 'Failed to delete customer' });
    }
  }

  // Batch create customers - much faster for bulk inserts
  async createMany(req: Request, res: Response): Promise<void> {
    try {
      const { customers } = req.body;
      
      if (!Array.isArray(customers) || customers.length === 0) {
        res.status(400).json({ error: 'Customers array is required' });
        return;
      }

      const result = await prisma.$transaction(async (tx) => {
        const created = [];
        for (const customer of customers) {
          const c = await tx.customer.create({
            data: {
              tenantId: customer.tenantId,
              fullName: customer.fullName,
              phone: customer.phone,
              address: customer.address || '',
              notes: customer.notes || '',
              city: customer.city || '',
            },
          });
          created.push(c);
        }
        return created;
      }, {
        timeout: 30000, // 30 seconds for batch
      });

      res.status(201).json({
        count: result.length,
        customers: result,
      });
    } catch (error) {
      Logger.error('Batch create customers error:', error);
      res.status(500).json({ error: 'Failed to create customers' });
    }
  }
}
