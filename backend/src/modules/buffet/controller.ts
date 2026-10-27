import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth';
import { logAuditFromRequest } from '../../middleware/audit.middleware';
import { Logger } from '../../infrastructure/logging/logger';
import { BuffetError, BuffetService } from './service';

export class BuffetController {
  private service = new BuffetService();

  private send(res: Response, fn: () => Promise<unknown>, status = 200) {
    return fn()
      .then((data) => res.status(status).json({ success: true, data }))
      .catch((error: unknown) => {
        if (error instanceof BuffetError) {
          return res.status(error.status).json({ success: false, error: { code: error.code, message: error.message } });
        }
        Logger.error('Buffet request failed', error);
        const message = error instanceof Error ? error.message : 'Buffet request failed';
        return res.status(400).json({ success: false, error: { code: 'BUFFET_ERROR', message } });
      });
  }

  items = (req: AuthRequest, res: Response) =>
    this.send(res, () => this.service.listItems(req.user!.tenantId, req.query.search as string | undefined));

  catalog = (req: AuthRequest, res: Response) =>
    this.send(res, () => this.service.listCatalog(req.user!.tenantId, req.query.search as string | undefined));

  itemByBarcode = (req: AuthRequest, res: Response) =>
    this.send(res, () => this.service.getItemByBarcode(req.user!.tenantId, req.params.code));

  updateItem = (req: AuthRequest, res: Response) =>
    this.send(res, () => this.service.updateItem(req.user!.tenantId, req.params.id, req.body || {}));

  listSales = (req: AuthRequest, res: Response) =>
    this.send(res, () => this.service.listSales(req.user!.tenantId, Number(req.query.limit) || 50));

  getSale = (req: AuthRequest, res: Response) =>
    this.send(res, () => this.service.getSale(req.user!.tenantId, req.params.id));

  createSale = (req: AuthRequest, res: Response) =>
    this.send(res, () => this.service.createSale(req.user!.tenantId, req.user!.id, req.body || {}), 201);

  addLine = (req: AuthRequest, res: Response) =>
    this.send(res, () => this.service.addLine(req.user!.tenantId, req.params.id, req.body?.barcode));

  setLineQuantity = (req: AuthRequest, res: Response) =>
    this.send(res, () => this.service.setLineQuantity(req.user!.tenantId, req.params.id, req.params.lineId, req.body?.quantity));

  removeLine = (req: AuthRequest, res: Response) =>
    this.send(res, () => this.service.removeLine(req.user!.tenantId, req.params.id, req.params.lineId));

  cancelSale = (req: AuthRequest, res: Response) =>
    this.send(res, () => this.service.cancelSale(req.user!.tenantId, req.params.id));

  complete = (req: AuthRequest, res: Response) =>
    this.send(res, async () => {
      const sale = await this.service.complete(req.user!.tenantId, req.user!.id, req.params.id, req.body?.settlement);
      logAuditFromRequest(req, 'BUFFET_SALE_COMPLETED', 'BuffetSale', req.params.id, null, sale);
      return sale;
    });

  employees = (req: AuthRequest, res: Response) =>
    this.send(res, () => this.service.listEmployees(req.user!.tenantId, req.query.search as string | undefined));

  bookings = (req: AuthRequest, res: Response) =>
    this.send(res, () => this.service.listActiveBookings(req.user!.tenantId, req.query.search as string | undefined));

  debts = (req: AuthRequest, res: Response) =>
    this.send(res, () => this.service.listDebts(req.user!.tenantId));

  payDebt = (req: AuthRequest, res: Response) =>
    this.send(res, async () => {
      const result = await this.service.payDebt(req.user!.tenantId, req.user!.id, req.params.invoiceId, req.body || {});
      logAuditFromRequest(req, 'BUFFET_DEBT_PAID', 'Invoice', req.params.invoiceId, null, result);
      return result;
    });
}
