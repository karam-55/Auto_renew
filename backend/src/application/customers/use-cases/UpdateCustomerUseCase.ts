import { CustomerRepository } from '../interfaces/CustomerRepository';
import { IVehicleRepository } from '../interfaces/IVehicleRepository';
import { UpdateCustomerCommand } from '../commands/UpdateCustomerCommand';
import { CustomerDTO } from '../dto/CustomerDTO';
import { Customer } from '../../../domain/customers/entities/Customer';
import { PhoneNumber } from '../../../domain/customers/value-objects/PhoneNumber';

export class UpdateCustomerUseCase {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly vehicleRepository: IVehicleRepository
  ) {}

  async execute(command: UpdateCustomerCommand): Promise<CustomerDTO> {
    const { customerId, dto } = command;

    // Validate DTO
    const validation = dto.validate();
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // Find customer
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Check for duplicate phone (if phone is being changed)
    if (dto.phone && customer.phone.getValue() !== dto.phone) {
      const phoneNumber = new PhoneNumber(dto.phone);
      const existingCustomer = await this.customerRepository.findByPhoneAndTenantId(phoneNumber, customer.tenantId);
      if (existingCustomer && existingCustomer.id !== customerId) {
        throw new Error('Customer with this phone number already exists');
      }
    }

    // Update customer
    const updatedCustomer = customer.update(
      dto.fullName,
      dto.phone ? new PhoneNumber(dto.phone) : customer.phone,
      dto.address,
      dto.notes,
      dto.city,
      dto.isVip
    );

    // Save customer
    const savedCustomer = await this.customerRepository.update(updatedCustomer);

    // Get vehicles count
    const vehiclesCount = await this.vehicleRepository.countByCustomerId(customerId);

    return CustomerDTO.fromEntity(savedCustomer, vehiclesCount);
  }
}
