import { randomUUID } from 'crypto';
import { JournalEntryStatus } from '@prisma/client';
import prisma from '../../config/database';
import { createJournalEntry, ensureDefaultAccounts, getAccountIdByRole } from '../accounting/automatic-journal-entries';
import {
  BalanceAdjustmentMode,
  debitMinusCredit,
  LedgerCurrency,
  naturalBalance,
  planBalanceAdjustment,
  round2,
} from '../accounting/ledger';
import { AuditLog } from '../../infrastructure/logging/audit-log';

export interface BalanceAdjustmentInput {
  currency: LedgerCurrency;
  mode: BalanceAdjustmentMode;
  amount: number;
  entryDate?: string;
  notes?: string;
}

const CURRENCIES: LedgerCurrency[] = ['SYP', 'USD'];
const MODES: BalanceAdjustmentMode[] = ['ADD', 'SUBTRACT', 'SET'];

export class AccountBalanceAdjustmentService {
  async adjustBalance(tenantId: string, accountId: string, userId: string, input: BalanceAdjustmentInput) {
    if (!CURRENCIES.includes(input.currency)) throw new Error('Currency must be SYP or USD');
    if (!MODES.includes(input.mode)) throw new Error('Mode must be ADD, SUBTRACT or SET');
    const amount = round2(Number(input.amount));
    if (!Number.isFinite(amount) || (input.mode !== 'SET' && amount <= 0)) {
      throw new Error('Amount must be a positive number');
    }
    const entryDate = input.entryDate ? new Date(input.entryDate) : new Date();
    if (isNaN(entryDate.getTime())) throw new Error('Invalid entry date');

    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.account.findFirst({
        where: { id: accountId, tenantId, deletedAt: null },
        include: { children: { select: { id: true }, take: 1 } },
      });
      if (!account) throw new Error('Account not found');
      if (!account.isActive) throw new Error('Inactive accounts cannot receive balance adjustments');
      if (account.children.length > 0) throw new Error('Parent accounts cannot receive direct balance adjustments');

      let offsetAccountId = await getAccountIdByRole(tenantId, 'OPENING_BALANCE_EQUITY', tx);
      if (!offsetAccountId) {
        await ensureDefaultAccounts(tenantId, tx);
        offsetAccountId = await getAccountIdByRole(tenantId, 'OPENING_BALANCE_EQUITY', tx);
      }
      if (!offsetAccountId) throw new Error('Opening balance equity account is not configured');
      if (offsetAccountId === account.id) throw new Error('The opening balance equity account cannot be adjusted directly');

      const aggregate = await tx.journalLine.aggregate({
        where: {
          accountId: account.id,
          deletedAt: null,
          entry: { tenantId, status: JournalEntryStatus.POSTED, deletedAt: null },
        },
        _sum: { debitSYP: true, creditSYP: true, debitUSD: true, creditUSD: true },
      });
      const totals = {
        debitSYP: Number(aggregate._sum.debitSYP || 0),
        creditSYP: Number(aggregate._sum.creditSYP || 0),
        debitUSD: Number(aggregate._sum.debitUSD || 0),
        creditUSD: Number(aggregate._sum.creditUSD || 0),
      };
      const balanceBefore = debitMinusCredit(totals, input.currency);
      const currentNatural = naturalBalance(account.accountType, balanceBefore);
      const plan = planBalanceAdjustment(account.accountType, currentNatural, input.mode, amount);
      const offsetSide = plan.accountSide === 'DEBIT' ? 'CREDIT' : 'DEBIT';
      const isUsd = input.currency === 'USD';

      const description = input.notes?.trim() || `تعديل رصيد ${account.code} — ${account.nameAr}`;
      const line = (lineAccountId: string, side: 'DEBIT' | 'CREDIT') => ({
        accountId: lineAccountId,
        debitSYP: !isUsd && side === 'DEBIT' ? plan.amount : 0,
        creditSYP: !isUsd && side === 'CREDIT' ? plan.amount : 0,
        debitUSD: isUsd && side === 'DEBIT' ? plan.amount : 0,
        creditUSD: isUsd && side === 'CREDIT' ? plan.amount : 0,
        description,
      });

      const entry = await createJournalEntry(
        tenantId,
        entryDate,
        description,
        `ADJ-${account.code}`,
        'ACCOUNT_BALANCE_ADJUSTMENT',
        randomUUID(),
        userId,
        [line(account.id, plan.accountSide), line(offsetAccountId, offsetSide)],
        tx,
      );

      const signedDelta = plan.accountSide === 'DEBIT' ? plan.amount : -plan.amount;
      return {
        entryId: entry.id,
        accountId: account.id,
        currency: input.currency,
        balanceBefore: currentNatural,
        balanceAfter: naturalBalance(account.accountType, round2(balanceBefore + signedDelta)),
        side: plan.accountSide,
        amount: plan.amount,
      };
    }, { isolationLevel: 'Serializable' });

    await AuditLog.log({
      userId,
      action: 'ACCOUNT_BALANCE_ADJUSTED',
      entityType: 'Account',
      entityId: accountId,
      changes: { ...input, entryId: result.entryId, balanceBefore: result.balanceBefore, balanceAfter: result.balanceAfter },
    });

    return result;
  }
}
