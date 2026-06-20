import { CustomerRepository } from '../interfaces/CustomerRepository';
import { Customer } from '../../../domain/customers/entities/Customer';
import { PhoneNumber } from '../../../domain/customers/value-objects/PhoneNumber';

export class UpdateCustomer {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(
    customerId: string,
    fullName?: string,
    phone?: string,
    address?: string,
    notes?: string,
    city?: string,
    isVip?: boolean
  ): Promise<Customer> {
    // Get existing customer
    const existingCustomer = await this.customerRepository.findById(customerId);

    if (!existingCustomer) {
      throw new Error('Customer not found');
    }

    // Update fields
    const updatedPhone = phone ? new PhoneNumber(phone) : existingCustomer.phone;
    const updatedFullName = fullName || existingCustomer.fullName;
    const updatedAddress = address !== undefined ? address : existingCustomer.address;
    const updatedNotes = notes !== undefined ? notes : existingCustomer.notes;
    const updatedCity = city !== undefined ? city : existingCustomer.city;
    const updatedIsVip = isVip !== undefined ? isVip : existingCustomer.isVip;

    const updatedCustomer = new Customer(
      existingCustomer.id,
      updatedPhone,
      updatedFullName,
      existingCustomer.tenantId,
      updatedAddress,
      updatedNotes,
      updatedCity,
      updatedIsVip,
      existingCustomer.loyaltyPoints,
      existingCustomer.isActive,
      existingCustomer.createdAt,
      new Date()
    );

    return await this.customerRepository.update(updatedCustomer);
  }
}
