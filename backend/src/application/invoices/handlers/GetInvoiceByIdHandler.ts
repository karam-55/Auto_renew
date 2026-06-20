import { GetInvoiceByIdUseCase } from '../use-cases/GetInvoiceByIdUseCase';
import { GetInvoiceByIdQuery } from '../queries/GetInvoiceByIdQuery';

export class GetInvoiceByIdHandler {
  constructor(private readonly getInvoiceById: GetInvoiceByIdUseCase) {}

  async handle(query: GetInvoiceByIdQuery) {
    return await this.getInvoiceById.execute(query);
  }
}
