import { UpdateBookingStatusDTO } from '../dto/UpdateBookingStatusDTO';

export class UpdateBookingStatusCommand {
  constructor(
    public readonly bookingId: string,
    public readonly dto: UpdateBookingStatusDTO
  ) {}
}
