import { CustomerRepository } from '../interfaces/CustomerRepository';
import { IVehicleRepository } from '../interfaces/IVehicleRepository';
import { ListCustomersQuery } from '../queries/ListCustomersQuery';
import { CustomerDTO } from '../dto/CustomerDTO';

export class ListCustomersUseCase {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly vehicleRepository: IVehicleRepository
  ) {}

  async execute(query: ListCustomersQuery): Promise<CustomerDTO[]> {
    const { tenantId } = query;

    const customers = await this.customerRepository.findByTenantId(tenantId);

    const customerDTOs = await Promise.all(
      customers.map(async (customer) => {
        const vehiclesCount = await this.vehicleRepository.countByCustomerId(customer.id);
        return CustomerDTO.fromEntity(customer, vehiclesCount);
      })
    );

    return customerDTOs;
  }
}
