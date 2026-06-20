import { UpdateVehicleDto } from '../dto/update-vehicle.dto';

export class UpdateVehicleCommand {
  constructor(
    public readonly vehicleId: string,
    public readonly dto: UpdateVehicleDto
  ) {}
}
