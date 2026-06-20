import { UpdateBookingStatusUseCase } from '../use-cases/UpdateBookingStatusUseCase';
import { UpdateBookingStatusCommand } from '../commands/UpdateBookingStatusCommand';

export class UpdateBookingStatusHandler {
  constructor(private readonly updateBookingStatus: UpdateBookingStatusUseCase) {}

  async handle(command: UpdateBookingStatusCommand) {
    return await this.updateBookingStatus.execute(command);
  }
}
