import { CustomerRepository } from '../interfaces/CustomerRepository';

export class DeleteCustomer {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(customerId: string): Promise<void> {
    const customer = await this.customerRepository.findById(customerId);

    if (!customer) {
      throw new Error('Customer not found');
    }

    await this.customerRepository.delete(customerId);
  }
}
