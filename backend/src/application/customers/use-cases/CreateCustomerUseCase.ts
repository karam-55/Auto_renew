import { CustomerRepository } from '../interfaces/CustomerRepository';
import { CreateCustomerCommand } from '../commands/CreateCustomerCommand';
import { CustomerDTO } from '../dto/CustomerDTO';
import { Customer } from '../../../domain/customers/entities/Customer';
import { PhoneNumber } from '../../../domain/customers/value-objects/PhoneNumber';
import { v4 as uuidv4 } from 'uuid';

export class CreateCustomerUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(command: CreateCustomerCommand): Promise<CustomerDTO> {
    const { dto } = command;

    // Validate DTO
    const validation = dto.validate();
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // Check for duplicate phone
    const phoneNumber = new PhoneNumber(dto.phone);
    const existingCustomer = await this.customerRepository.findByPhoneAndTenantId(phoneNumber, dto.tenantId);
    if (existingCustomer) {
      throw new Error('Customer with this phone number already exists');
    }

    // Create customer entity
    const customer = Customer.create(
      uuidv4(),
      phoneNumber,
      dto.fullName,
      dto.tenantId,
      dto.address,
      dto.notes,
      dto.city
    );

    // Save customer
    const savedCustomer = await this.customerRepository.create(customer);

    return CustomerDTO.fromEntity(savedCustomer, 0);
  }
}
