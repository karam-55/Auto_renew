import { ListBookingsUseCase } from '../use-cases/ListBookingsUseCase';
import { ListBookingsQuery } from '../queries/ListBookingsQuery';

export class ListBookingsHandler {
  constructor(private readonly listBookings: ListBookingsUseCase) {}

  async handle(query: ListBookingsQuery) {
    return await this.listBookings.execute(query);
  }
}
