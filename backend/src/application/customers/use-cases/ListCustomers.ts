import { CustomerRepository } from '../interfaces/CustomerRepository';
import { Customer } from '../../../domain/customers/entities/Customer';

export class ListCustomers {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(tenantId: string): Promise<Customer[]> {
    return await this.customerRepository.findByTenantId(tenantId);
  }
}
