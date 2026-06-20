import { ListAllVehiclesUseCase } from '../use-cases/ListAllVehiclesUseCase';
import { ListAllVehiclesQuery } from '../queries/ListAllVehiclesQuery';

export class ListAllVehiclesHandler {
  constructor(private readonly listAllVehicles: ListAllVehiclesUseCase) {}

  async handle(query: ListAllVehiclesQuery) {
    return await this.listAllVehicles.execute(query);
  }
}
