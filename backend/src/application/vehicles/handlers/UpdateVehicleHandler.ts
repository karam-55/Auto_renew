import { UpdateVehicleUseCase } from '../use-cases/UpdateVehicleUseCase';
import { UpdateVehicleCommand } from '../commands/UpdateVehicleCommand';

export class UpdateVehicleHandler {
  constructor(private readonly updateVehicle: UpdateVehicleUseCase) {}

  async handle(command: UpdateVehicleCommand) {
    return await this.updateVehicle.execute(command);
  }
}
