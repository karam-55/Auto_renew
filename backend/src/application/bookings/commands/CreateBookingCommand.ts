import { CreateBookingDTO } from '../dto/CreateBookingDTO';

export class CreateBookingCommand {
  constructor(public readonly dto: CreateBookingDTO) {}
}
