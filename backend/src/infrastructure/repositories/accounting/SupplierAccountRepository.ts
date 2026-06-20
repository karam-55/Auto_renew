import { ISupplierAccountRepository } from '../../../application/accounting/interfaces/ISupplierAccountRepository';
import { PrismaService } from '../../database/prisma.service';
import { DatabaseError } from '../../errors/database-error';

export class SupplierAccountRepository implements ISupplierAccountRepository {
  async getBalance(supplierId: string): Promise<number> {
    try {
      const prisma = PrismaService.getInstance();
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
      });
      
      if (!supplier) {
        throw new Error('Supplier not found');
      }
      
      return Number(supplier.balance);
    } catch (error) {
      throw new DatabaseError('Failed to get supplier balance', error);
    }
  }

  async getStatement(supplierId: string): Promise<any[]> {
    try {
      const prisma = PrismaService.getInstance();
      const purchaseOrders = await prisma.purchaseOrder.findMany({
        where: { supplierId },
        orderBy: { orderDate: 'desc' },
      });
      
      const statement = [];
      for (const po of purchaseOrders) {
        statement.push({
          type: 'PURCHASE_ORDER',
          date: po.orderDate,
          reference: po.orderNumber,
          debit: Number(po.totalSYP),
          credit: 0,
          balance: 0,
        });
      }
      
      let runningBalance = 0;
      for (const item of statement.reverse()) {
        runningBalance += item.debit - item.credit;
        item.balance = runningBalance;
      }
      
      return statement.reverse();
    } catch (error) {
      throw new DatabaseError('Failed to get supplier statement', error);
    }
  }
}
