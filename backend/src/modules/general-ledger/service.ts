import prisma from '../../config/database';
import { GeneralLedgerFilters, GeneralLedgerResponse, GeneralLedgerAccountSection, GeneralLedgerLine } from './types';
import { Logger } from '../../infrastructure/logging/logger';

export class GeneralLedgerService {
  /**
   * Generate the General Ledger report
   * Shows all journal lines grouped by account with running balance
   */
  async generateGeneralLedger(
    tenantId: string,
    filters: GeneralLedgerFilters
  ): Promise<GeneralLedgerResponse> {
    const fromDate = filters.fromDate || new Date('2000-01-01');
    const toDate = filters.toDate || new Date();

    const limit = Math.min(filters.limit || 200, 500); // Max 500 lines
    const offset = filters.offset || 0;

    // Get all journal lines within date range (POSTED only)
    const journalLines = await prisma.journalLine.findMany({
      where: {
        entry: {
          tenantId,
          entryDate: {
            gte: fromDate,
            lte: toDate,
          },
          status: 'POSTED',
        },
        ...(filters.accountId ? { accountId: filters.accountId } : {}),
      },
      include: {
        account: true,
        entry: true,
      },
      orderBy: [
        { accountId: 'asc' },
        { entry: { entryDate: 'asc' } },
      ],
      take: limit,
      skip: offset,
    });

    // Get opening balances for each account (lines before fromDate)
    const accountIds = [...new Set(journalLines.map((l) => l.accountId))];
    const openingBalances = new Map<string, { syp: number; usd: number }>();

    if (accountIds.length > 0) {
      const openingLines = await prisma.journalLine.findMany({
        where: {
          accountId: { in: accountIds },
          entry: {
            tenantId,
            entryDate: { lt: fromDate },
            status: 'POSTED',
          },
        },
        include: { account: true },
      });

      for (const line of openingLines) {
        const current = openingBalances.get(line.accountId) || { syp: 0, usd: 0 };
        current.syp += Number(line.debitSYP || 0) - Number(line.creditSYP || 0);
        current.usd += Number(line.debitUSD || 0) - Number(line.creditUSD || 0);
        openingBalances.set(line.accountId, current);
      }
    }

    // Group lines by account and calculate running balance
    const accountMap = new Map<string, GeneralLedgerAccountSection>();
    let grandTotalDebitSYP = 0;
    let grandTotalCreditSYP = 0;

    for (const line of journalLines) {
      const accountId = line.accountId;
      let section = accountMap.get(accountId);

      if (!section) {
        const opening = openingBalances.get(accountId) || { syp: 0, usd: 0 };
        section = {
          accountId,
          accountCode: line.account.code,
          accountName: line.account.nameEn || line.account.nameAr || 'Unknown',
          accountNameAr: line.account.nameAr,
          accountType: line.account.accountType,
          openingBalanceSYP: opening.syp,
          openingBalanceUSD: opening.usd,
          totalDebitSYP: 0,
          totalCreditSYP: 0,
          totalDebitUSD: 0,
          totalCreditUSD: 0,
          closingBalanceSYP: opening.syp,
          closingBalanceUSD: opening.usd,
          lines: [],
        };
        accountMap.set(accountId, section);
      }

      const debitSYP = Number(line.debitSYP || 0);
      const creditSYP = Number(line.creditSYP || 0);
      const debitUSD = Number(line.debitUSD || 0);
      const creditUSD = Number(line.creditUSD || 0);

      // Determine normal balance direction for running balance display
      // Assets, COGS & Expenses: debit increases, credit decreases
      // Liabilities, Equity, Revenue: credit increases, debit decreases
      const isDebitBalance = line.account.accountType === 'ASSET' || line.account.accountType === 'COGS' || line.account.accountType === 'EXPENSE';
      const changeSYP = isDebitBalance ? debitSYP - creditSYP : creditSYP - debitSYP;

      section.closingBalanceSYP += changeSYP;
      section.closingBalanceUSD! += isDebitBalance ? debitUSD - creditUSD : creditUSD - debitUSD;
      section.totalDebitSYP += debitSYP;
      section.totalCreditSYP += creditSYP;
      section.totalDebitUSD! += debitUSD;
      section.totalCreditUSD! += creditUSD;

      grandTotalDebitSYP += debitSYP;
      grandTotalCreditSYP += creditSYP;

      const glLine: GeneralLedgerLine = {
        id: line.id,
        entryId: line.entryId,
        entryDate: line.entry.entryDate,
        reference: line.entry.reference,
        description: line.description || line.entry.description || '',
        accountId: line.accountId,
        accountCode: line.account.code,
        accountName: line.account.nameEn || line.account.nameAr || 'Unknown',
        accountNameAr: line.account.nameAr,
        accountType: line.account.accountType,
        debitSYP,
        creditSYP,
        debitUSD,
        creditUSD,
        runningBalanceSYP: section.closingBalanceSYP,
        sourceType: line.entry.sourceType,
        sourceId: line.entry.sourceId,
      };

      section.lines.push(glLine);
    }

    // Convert map to sorted array
    const sections = Array.from(accountMap.values()).sort((a, b) =>
      a.accountCode.localeCompare(b.accountCode)
    );

    return {
      tenantId,
      fromDate,
      toDate,
      sections,
      grandTotalDebitSYP,
      grandTotalCreditSYP,
      generatedAt: new Date(),
    };
  }
}
