import { GetCustomerByIdUseCase } from '../use-cases/GetCustomerByIdUseCase';
import { GetCustomerByIdQuery } from '../queries/GetCustomerByIdQuery';

export class GetCustomerByIdHandler {
  constructor(private readonly getCustomerById: GetCustomerByIdUseCase) {}

  async handle(query: GetCustomerByIdQuery) {
    return await this.getCustomerById.execute(query);
  }
}
