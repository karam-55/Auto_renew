import prisma from '../../config/database';
import settingsService from '../../services/settings.service';
import { createJournalEntry, ensureDefaultAccounts, getAccountIdByRole } from '../accounting/automatic-journal-entries';

export class SupplierPaymentService {
  async createPayment(tenantId: string, userId: string, input: any) {
    const supplier = await prisma.supplier.findFirst({
      where: { id: input.supplierId, tenantId, isActive: true, deletedAt: null },
    });
    if (!supplier) throw new Error('Supplier not found or inactive');
    if (!['CASH', 'BANK'].includes(input.paymentMethod)) throw new Error('Payment method must be CASH or BANK');
    if (!['SYP', 'USD'].includes(input.currency)) throw new Error('Payment currency must be SYP or USD');

    const exchangeRate = await settingsService.getRequiredExchangeRate(tenantId);
    const originalAmount = Math.round(Number(input.amount) * 100) / 100;
    if (!Number.isFinite(originalAmount) || originalAmount <= 0) throw new Error('Payment amount must be positive');
    const originalCurrency = input.currency === 'USD' ? 'USD' : 'SYP';
    const amountSYP = originalCurrency === 'USD'
      ? Math.round(originalAmount * exchangeRate * 100) / 100
      : originalAmount;
    const amountUSD = originalCurrency === 'USD'
      ? Math.round(originalAmount * 100) / 100
      : Math.round((originalAmount / exchangeRate) * 100) / 100;
    const paymentDate = input.paymentDate ? new Date(input.paymentDate) : new Date();
    if (Number.isNaN(paymentDate.getTime())) throw new Error('Invalid payment date');

    return prisma.$transaction(async (tx) => {
      const idempotencyKey = typeof input.idempotencyKey === 'string' ? input.idempotencyKey.trim() : '';
      if (idempotencyKey) {
        const existing = await tx.supplierPayment.findFirst({
          where: { tenantId, idempotencyKey },
        });
        if (existing) {
          const sameRequest = existing.supplierId === supplier.id &&
            Number(existing.originalAmount) === originalAmount &&
            existing.originalCurrency === originalCurrency &&
            existing.paymentMethod === input.paymentMethod;
          if (!sameRequest) throw new Error('Idempotency key was already used for a different supplier payment');
          return existing;
        }
      }

      await ensureDefaultAccounts(tenantId, tx);
      const payableAccountId = await getAccountIdByRole(tenantId, 'ACCOUNTS_PAYABLE', tx);
      const settlementAccountId = await getAccountIdByRole(tenantId, input.paymentMethod === 'CASH' ? 'CASH' : 'BANK', tx);
      if (!payableAccountId || !settlementAccountId) throw new Error('Supplier payment accounts are not configured');

      const payment = await tx.supplierPayment.create({
        data: {
          tenantId,
          supplierId: supplier.id,
          amountSYP,
          amountUSD,
          paymentDate,
          paymentMethod: input.paymentMethod,
          reference: input.reference || null,
          notes: input.notes || null,
          originalAmount,
          originalCurrency,
          exchangeRateUsed: exchangeRate,
          idempotencyKey: idempotencyKey || null,
          createdById: userId,
        },
      });

      await createJournalEntry(
        tenantId,
        paymentDate,
        `Supplier payment - ${supplier.name}`,
        payment.reference || payment.id,
        'SUPPLIER_PAYMENT',
        payment.id,
        userId,
        [
          {
            accountId: payableAccountId,
            debitSYP: amountSYP,
            debitUSD: amountUSD,
            creditSYP: 0,
            creditUSD: 0,
            description: `Supplier payable settlement: ${supplier.name}`,
            supplierId: supplier.id,
          },
          {
            accountId: settlementAccountId,
            debitSYP: 0,
            debitUSD: 0,
            creditSYP: amountSYP,
            creditUSD: amountUSD,
            description: `Supplier payment via ${input.paymentMethod}`,
            supplierId: supplier.id,
          },
        ],
        tx,
        exchangeRate
      );

      await tx.supplier.update({
        where: { id: supplier.id },
        data: { balance: { decrement: amountSYP } },
      });

      return payment;
    }, { isolationLevel: 'Serializable' });
  }

  async getSupplierStatement(tenantId: string, supplierId: string, from?: Date, to?: Date) {
    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, tenantId, deletedAt: null },
      select: { id: true, name: true, balance: true },
    });
    if (!supplier) throw new Error('Supplier not found');

    const entryDate: Record<string, Date> = {};
    if (to) entryDate.lte = to;
    const fromDate = from ? { gte: from } : undefined;
    const [lines, inventoryTransactions, supplierExpenses, payments] = await Promise.all([
      prisma.journalLine.findMany({
        where: {
          supplierId,
          account: { accountType: 'LIABILITY' },
          entry: { tenantId, status: 'POSTED', ...(Object.keys(entryDate).length ? { entryDate } : {}) },
        },
        include: {
          entry: { select: { id: true, entryDate: true, reference: true, description: true, sourceType: true } },
          account: { select: { code: true, nameAr: true } },
        },
        orderBy: [{ entry: { entryDate: 'asc' } }, { createdAt: 'asc' }],
      }),
      prisma.inventoryTransaction.findMany({
        where: {
          tenantId,
          supplierId,
          deletedAt: null,
          type: { in: ['PURCHASE', 'STOCK_IN', 'RETURN'] },
          ...(fromDate || to ? { createdAt: { ...(fromDate || {}), ...(to ? { lte: to } : {}) } } : {}),
        },
        include: {
          part: { select: { name: true, nameAr: true, baseUnitName: true } },
          warehouse: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.expense.findMany({
        where: {
          tenantId,
          supplierId,
          deletedAt: null,
          ...(from || to ? { expenseDate: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
        },
        orderBy: { expenseDate: 'desc' },
      }),
      prisma.supplierPayment.findMany({
        where: {
          tenantId,
          supplierId,
          deletedAt: null,
          ...(from || to ? { paymentDate: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
        },
        orderBy: { paymentDate: 'desc' },
      }),
    ]);

    let balanceSYP = 0;
    let balanceUSD = 0;
    let openingBalanceSYP = 0;
    let openingBalanceUSD = 0;
    const transactions: any[] = [];
    for (const line of lines) {
      const isBeforePeriod = from && line.entry.entryDate < from;
      const debitSYP = Number(line.debitSYP);
      const creditSYP = Number(line.creditSYP);
      const debitUSD = Number(line.debitUSD);
      const creditUSD = Number(line.creditUSD);
      balanceSYP += creditSYP - debitSYP;
      balanceUSD += creditUSD - debitUSD;
      if (isBeforePeriod) {
        openingBalanceSYP = balanceSYP;
        openingBalanceUSD = balanceUSD;
        continue;
      }
      transactions.push({
        date: line.entry.entryDate,
        reference: line.entry.reference,
        description: line.description || line.entry.description,
        accountCode: line.account.code,
        accountName: line.account.nameAr,
        dueDate: line.dueDate,
        sourceType: line.entry.sourceType,
        debitSYP,
        creditSYP,
        balanceSYP,
        debitUSD,
        creditUSD,
        balanceUSD,
      });
    }

    const activity = [
      ...inventoryTransactions.map((movement) => ({
        id: movement.id,
        date: movement.createdAt,
        kind: movement.type === 'RETURN' ? 'RETURN' : 'PURCHASE',
        description: movement.type === 'RETURN'
          ? `إعادة مادة إلى المخزون: ${movement.part.nameAr || movement.part.name}`
          : `استلام مادة: ${movement.part.nameAr || movement.part.name}`,
        quantity: Math.abs(Number(movement.quantity)),
        unitName: movement.part.baseUnitName || 'وحدة',
        amountSYP: Math.abs(Number(movement.quantity) * Number(movement.costSYP)),
        amountUSD: movement.costUSD == null
          ? null
          : Math.abs(Number(movement.quantity) * Number(movement.costUSD)),
        warehouseName: movement.warehouse?.name || null,
        reference: movement.reference,
        notes: movement.notes,
      })),
      ...supplierExpenses.map((expense) => ({
        id: expense.id,
        date: expense.expenseDate,
        kind: 'DIRECT_PURCHASE',
        description: expense.description || 'شراء مباشر من المورد',
        quantity: expense.quantity == null ? null : Number(expense.quantity),
        unitName: null,
        amountSYP: Number(expense.amountSYP),
        amountUSD: expense.amountUSD == null ? null : Number(expense.amountUSD),
        warehouseName: null,
        reference: expense.reference,
        notes: expense.notes,
      })),
      ...payments.map((payment) => ({
        id: payment.id,
        date: payment.paymentDate,
        kind: 'PAYMENT',
        description: `دفعة للمورد (${payment.paymentMethod === 'CASH' ? 'نقداً' : 'من البنك'})`,
        quantity: null,
        unitName: null,
        amountSYP: Number(payment.amountSYP),
        amountUSD: payment.amountUSD == null ? null : Number(payment.amountUSD),
        warehouseName: null,
        reference: payment.reference,
        notes: payment.notes,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      supplier: { ...supplier, balance: Number(supplier.balance) },
      openingBalanceSYP,
      openingBalanceUSD,
      closingBalanceSYP: balanceSYP,
      closingBalanceUSD: balanceUSD,
      transactions,
      activity,
    };
  }
}

export const supplierPaymentService = new SupplierPaymentService();
