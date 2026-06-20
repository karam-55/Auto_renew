import { CreateBookingUseCase } from '../use-cases/CreateBookingUseCase';
import { CreateBookingCommand } from '../commands/CreateBookingCommand';

export class CreateBookingHandler {
  constructor(private readonly createBooking: CreateBookingUseCase) {}

  async handle(command: CreateBookingCommand) {
    return await this.createBooking.execute(command);
  }
}
