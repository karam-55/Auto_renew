import { CustomerRepository } from '../interfaces/CustomerRepository';
import { Customer } from '../../../domain/customers/entities/Customer';

export class GetCustomer {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(customerId: string): Promise<Customer> {
    const customer = await this.customerRepository.findById(customerId);

    if (!customer) {
      throw new Error('Customer not found');
    }

    return customer;
  }
}
