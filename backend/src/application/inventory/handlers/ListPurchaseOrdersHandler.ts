import { ListPurchaseOrders } from '../use-cases/ListPurchaseOrders';
import { ListPurchaseOrdersQuery } from '../queries/ListPurchaseOrdersQuery';

export class ListPurchaseOrdersHandler {
  constructor(private readonly listPurchaseOrders: ListPurchaseOrders) {}

  async handle(query: ListPurchaseOrdersQuery) {
    return await this.listPurchaseOrders.execute(query.tenantId);
  }
}
