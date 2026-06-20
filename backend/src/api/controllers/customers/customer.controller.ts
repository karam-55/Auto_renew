import { Request, Response } from 'express';
import { ErrorMiddleware } from '../../middlewares/error.middleware';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { CustomerRepository } from '../../../infrastructure/repositories/customers/CustomerRepository';
import { Customer } from '../../../domain/customers/entities/Customer';
import { PhoneNumber } from '../../../domain/customers/value-objects/PhoneNumber';

export class CustomerController {
  private customerRepository: CustomerRepository;

  constructor() {
    this.customerRepository = new CustomerRepository();
  }

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { fullName, phone, address, notes, city } = req.body;
      const tenantId = req.user?.tenantId || 'default';

      const customer = Customer.create(
        crypto.randomUUID(),
        new PhoneNumber(phone),
        fullName,
        tenantId,
        address,
        notes,
        city
      );

      const created = await this.customerRepository.create(customer);
      ErrorMiddleware.success(res, created, 201);
    } catch (error) {
      ErrorMiddleware.error(res, 'CREATE_ERROR', 'Failed to create customer', 500);
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const customer = await this.customerRepository.findById(id);

      if (!customer) {
        ErrorMiddleware.error(res, 'NOT_FOUND', 'Customer not found', 404);
        return;
      }

      ErrorMiddleware.success(res, customer, 200);
    } catch (error) {
      ErrorMiddleware.error(res, 'FETCH_ERROR', 'Failed to fetch customer', 500);
    }
  }

  async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || 'default';
      const customers = await this.customerRepository.findByTenantId(tenantId);

      ErrorMiddleware.success(res, customers, 200);
    } catch (error) {
      ErrorMiddleware.error(res, 'FETCH_ERROR', 'Failed to list customers', 500);
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { fullName, phone, address, notes, city } = req.body;

      const existing = await this.customerRepository.findById(id);
      if (!existing) {
        ErrorMiddleware.error(res, 'NOT_FOUND', 'Customer not found', 404);
        return;
      }

      const updated = existing.update(
        fullName,
        phone ? new PhoneNumber(phone) : undefined,
        address,
        notes,
        city
      );

      const saved = await this.customerRepository.update(updated);
      ErrorMiddleware.success(res, saved, 200);
    } catch (error) {
      ErrorMiddleware.error(res, 'UPDATE_ERROR', 'Failed to update customer', 500);
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.customerRepository.delete(id);

      ErrorMiddleware.success(res, { message: 'Customer deleted' }, 200);
    } catch (error) {
      ErrorMiddleware.error(res, 'DELETE_ERROR', 'Failed to delete customer', 500);
    }
  }

  async addLoyaltyPoints(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { points } = req.body;

      await this.customerRepository.addLoyaltyPoints(id, points);
      const customer = await this.customerRepository.findById(id);

      ErrorMiddleware.success(res, customer, 200);
    } catch (error) {
      ErrorMiddleware.error(res, 'LOYALTY_ERROR', 'Failed to add loyalty points', 500);
    }
  }
}
