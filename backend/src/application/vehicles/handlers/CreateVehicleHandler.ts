import { CreateVehicleUseCase } from '../use-cases/CreateVehicleUseCase';
import { CreateVehicleCommand } from '../commands/CreateVehicleCommand';

export class CreateVehicleHandler {
  constructor(private readonly createVehicle: CreateVehicleUseCase) {}

  async handle(command: CreateVehicleCommand) {
    return await this.createVehicle.execute(command);
  }
}
