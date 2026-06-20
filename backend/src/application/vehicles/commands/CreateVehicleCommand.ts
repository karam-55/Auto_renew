import { CreateVehicleDto } from '../dto/create-vehicle.dto';

export class CreateVehicleCommand {
  constructor(public readonly dto: CreateVehicleDto) {}
}
