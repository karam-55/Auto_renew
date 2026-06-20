import { CustomerRepository } from '../interfaces/CustomerRepository';
import { IVehicleRepository } from '../interfaces/IVehicleRepository';
import { GetCustomerByIdQuery } from '../queries/GetCustomerByIdQuery';
import { CustomerDTO } from '../dto/CustomerDTO';

export class GetCustomerByIdUseCase {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly vehicleRepository: IVehicleRepository
  ) {}

  async execute(query: GetCustomerByIdQuery): Promise<CustomerDTO> {
    const { customerId } = query;

    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    const vehiclesCount = await this.vehicleRepository.countByCustomerId(customerId);

    return CustomerDTO.fromEntity(customer, vehiclesCount);
  }
}
