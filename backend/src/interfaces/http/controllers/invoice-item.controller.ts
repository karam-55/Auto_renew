import { Request, Response } from 'express';
import { Logger } from '../../../infrastructure/logging/logger';
import { AddInvoiceItem } from '../../../application/invoices/use-cases/AddInvoiceItem';
import { RemoveInvoiceItem } from '../../../application/invoices/use-cases/RemoveInvoiceItem';
import { PrismaInvoiceItemRepository } from '../../../infrastructure/invoices/repositories/PrismaInvoiceItemRepository';

export class InvoiceItemController {
  private addInvoiceItem: AddInvoiceItem;
  private removeInvoiceItem: RemoveInvoiceItem;

  constructor() {
    const invoiceItemRepository = new PrismaInvoiceItemRepository();
    this.addInvoiceItem = new AddInvoiceItem(invoiceItemRepository);
    this.removeInvoiceItem = new RemoveInvoiceItem(invoiceItemRepository);
  }

  async add(req: Request, res: Response): Promise<void> {
    try {
      const { invoiceId, description, quantity, priceSYP, priceUSD, partId } = req.body;

      const invoiceItem = await this.addInvoiceItem.execute(
        invoiceId,
        description,
        quantity,
        priceSYP,
        priceUSD,
        partId
      );

      res.status(201).json({
        id: invoiceItem.id,
        invoiceId: invoiceItem.invoiceId,
        description: invoiceItem.description,
        quantity: invoiceItem.quantity,
        priceSYP: invoiceItem.priceSYP,
        priceUSD: invoiceItem.priceUSD,
        totalSYP: invoiceItem.totalSYP,
        totalUSD: invoiceItem.totalUSD,
        partId: invoiceItem.partId,
        createdAt: invoiceItem.createdAt,
      });
    } catch (error) {
      Logger.error('Add invoice item error:', error);
      res.status(500).json({ error: 'Failed to add invoice item' });
    }
  }

  async remove(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await this.removeInvoiceItem.execute(id);

      res.json({ message: 'Invoice item removed successfully' });
    } catch (error) {
      Logger.error('Remove invoice item error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove invoice item';
      if (errorMessage === 'Invoice item not found') {
        res.status(404).json({ error: errorMessage });
        return;
      }
      res.status(500).json({ error: 'Failed to remove invoice item' });
    }
  }
}
