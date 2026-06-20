import { GetVehicleByIdUseCase } from '../use-cases/GetVehicleByIdUseCase';
import { GetVehicleByIdQuery } from '../queries/GetVehicleByIdQuery';

export class GetVehicleByIdHandler {
  constructor(private readonly getVehicleById: GetVehicleByIdUseCase) {}

  async handle(query: GetVehicleByIdQuery) {
    return await this.getVehicleById.execute(query);
  }
}
