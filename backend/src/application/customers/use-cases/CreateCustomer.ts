import { CustomerRepository } from '../interfaces/CustomerRepository';
import { Customer } from '../../../domain/customers/entities/Customer';
import { PhoneNumber } from '../../../domain/customers/value-objects/PhoneNumber';
import { CustomerCreatedEvent } from '../../../domain/customers/events/CustomerCreatedEvent';
import { v4 as uuidv4 } from 'uuid';

export class CreateCustomer {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(
    tenantId: string,
    fullName: string,
    phone: string,
    address?: string,
    notes?: string,
    city?: string
  ): Promise<{ customer: Customer; event: CustomerCreatedEvent }> {
    const phoneNumber = new PhoneNumber(phone);

    // Check if customer already exists
    const existingCustomer = await this.customerRepository.findByPhoneAndTenantId(
      phoneNumber,
      tenantId
    );

    if (existingCustomer) {
      throw new Error('Customer with this phone number already exists');
    }

    // Create customer entity
    const customerId = uuidv4();
    const customer = Customer.create(
      customerId,
      phoneNumber,
      fullName,
      tenantId,
      address,
      notes,
      city
    );

    // Save customer
    const createdCustomer = await this.customerRepository.create(customer);

    // Create event
    const event = new CustomerCreatedEvent(createdCustomer);

    return { customer: createdCustomer, event };
  }
}
