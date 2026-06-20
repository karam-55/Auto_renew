import { ICustomerAccountRepository } from '../../../application/accounting/interfaces/ICustomerAccountRepository';
import { PrismaService } from '../../database/prisma.service';
import { DatabaseError } from '../../errors/database-error';

export class CustomerAccountRepository implements ICustomerAccountRepository {
  async getBalance(customerId: string): Promise<number> {
    try {
      const prisma = PrismaService.getInstance();
      const invoices = await prisma.invoice.findMany({
        where: { customerId },
      });
      
      let balance = 0;
      for (const invoice of invoices) {
        balance += Number(invoice.totalSYP) - Number(invoice.paidSYP);
      }
      
      return balance;
    } catch (error) {
      throw new DatabaseError('Failed to get customer balance', error);
    }
  }

  async getStatement(customerId: string): Promise<any[]> {
    try {
      const prisma = PrismaService.getInstance();
      const invoices = await prisma.invoice.findMany({
        where: { customerId },
        include: {
          payments: true,
        },
        orderBy: { invoiceDate: 'desc' },
      });
      
      const statement = [];
      for (const invoice of invoices) {
        statement.push({
          type: 'INVOICE',
          date: invoice.invoiceDate,
          reference: invoice.invoiceNumber,
          debit: Number(invoice.totalSYP),
          credit: 0,
          balance: 0,
        });
        
        for (const payment of invoice.payments) {
          statement.push({
            type: 'PAYMENT',
            date: payment.paymentDate,
            reference: payment.reference || 'Payment',
            debit: 0,
            credit: Number(payment.amountSYP),
            balance: 0,
          });
        }
      }
      
      let runningBalance = 0;
      for (const item of statement.reverse()) {
        runningBalance += item.debit - item.credit;
        item.balance = runningBalance;
      }
      
      return statement.reverse();
    } catch (error) {
      throw new DatabaseError('Failed to get customer statement', error);
    }
  }
}
