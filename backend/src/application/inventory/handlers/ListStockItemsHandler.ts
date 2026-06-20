import { ListParts } from '../use-cases/ListParts';
import { ListStockItemsQuery } from '../queries/ListStockItemsQuery';

export class ListStockItemsHandler {
  constructor(private readonly listParts: ListParts) {}

  async handle(query: ListStockItemsQuery) {
    return await this.listParts.execute(query.tenantId);
  }
}
