import { Request, Response } from 'express';
import { CustomerService } from './service';
import { AuthRequest } from '../../shared/middlewares/auth';
import { logAuditFromRequest } from '../../middleware/audit.middleware';
import { Logger } from '../../infrastructure/logging/logger';
import { getPaginationParams, createPaginatedResponse } from '../../shared/utils/pagination';

export class CustomerController {
  private customerService: CustomerService;

  constructor() {
    this.customerService = new CustomerService();
  }

  getAllCustomers = async (req: AuthRequest, res: Response) => {
    try {
      const { page, limit, skip } = getPaginationParams(req);
      const [customers, total] = await Promise.all([
        this.customerService.getAllCustomers(req.user!.tenantId, skip, limit),
        this.customerService.getCustomersCount(req.user!.tenantId),
      ]);
      res.json(createPaginatedResponse(customers, total, page, limit));
    } catch (error) {
      Logger.error('Get all customers error', error);
      res.status(500).json({ error: 'Failed to fetch customers' });
    }
  };

  getCustomerById = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const customer = await this.customerService.getCustomerById(req.user!.tenantId, id);

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      res.json({ customer });
    } catch (error) {
      Logger.error('Get customer error', error);
      res.status(500).json({ error: 'Failed to fetch customer' });
    }
  };

  searchCustomers = async (req: AuthRequest, res: Response) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Search query required' });
      }

      const customers = await this.customerService.searchCustomers(req.user!.tenantId, q);
      res.json({ customers });
    } catch (error) {
      Logger.error('Search customers error', error);
      res.status(500).json({ error: 'Failed to search customers' });
    }
  };

  createCustomer = async (req: AuthRequest, res: Response) => {
    try {
      const customer = await this.customerService.createCustomer(req.user!.tenantId, req.body);

      // Log customer creation
      logAuditFromRequest(req, 'CUSTOMER_CREATED', 'Customer', customer.id, null, customer);

      res.status(201).json({ customer });
    } catch (error: any) {
      Logger.error('Create customer error', error);
      res.status(400).json({ error: error.message || 'Failed to create customer' });
    }
  };

  updateCustomer = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const oldCustomer = await this.customerService.getCustomerById(req.user!.tenantId, id);
      const customer = await this.customerService.updateCustomer(req.user!.tenantId, id, req.body);

      // Log customer update
      logAuditFromRequest(req, 'CUSTOMER_UPDATED', 'Customer', id, oldCustomer, customer);

      res.json({ customer });
    } catch (error: any) {
      Logger.error('Update customer error', error);
      res.status(400).json({ error: error.message || 'Failed to update customer' });
    }
  };

  deleteCustomer = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: 'Invalid customer ID format. Must be a valid UUID.' });
      }

      const oldCustomer = await this.customerService.getCustomerById(req.user!.tenantId, id);
      await this.customerService.deleteCustomer(req.user!.tenantId, id);

      // Log customer deletion
      logAuditFromRequest(req, 'CUSTOMER_DELETED', 'Customer', id, oldCustomer, null);

      res.json({ message: 'Customer deleted successfully' });
    } catch (error: any) {
      Logger.error('Delete customer error', error);
      res.status(400).json({ error: error.message || 'Failed to delete customer' });
    }
  };

  addLoyaltyPoints = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { points } = req.body;
      if (typeof points !== 'number') {
        return res.status(400).json({ error: 'Points must be a number' });
      }

      const customer = await this.customerService.addLoyaltyPoints(req.user!.tenantId, id, points);
      res.json({ customer });
    } catch (error: any) {
      Logger.error('Add loyalty points error', error);
      res.status(400).json({ error: error.message || 'Failed to add loyalty points' });
    }
  };
}
