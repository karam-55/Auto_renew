import { ListVehiclesByCustomerUseCase } from '../use-cases/ListVehiclesByCustomerUseCase';
import { ListVehiclesByCustomerQuery } from '../queries/ListVehiclesByCustomerQuery';

export class ListVehiclesByCustomerHandler {
  constructor(private readonly listVehiclesByCustomer: ListVehiclesByCustomerUseCase) {}

  async handle(query: ListVehiclesByCustomerQuery) {
    return await this.listVehiclesByCustomer.execute(query);
  }
}
