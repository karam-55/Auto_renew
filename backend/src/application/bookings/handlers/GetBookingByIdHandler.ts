import { GetBookingByIdUseCase } from '../use-cases/GetBookingByIdUseCase';
import { GetBookingByIdQuery } from '../queries/GetBookingByIdQuery';

export class GetBookingByIdHandler {
  constructor(private readonly getBookingById: GetBookingByIdUseCase) {}

  async handle(query: GetBookingByIdQuery) {
    return await this.getBookingById.execute(query);
  }
}
