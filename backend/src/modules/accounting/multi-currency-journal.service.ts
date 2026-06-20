import prisma from '../../config/database';
import { CurrencyConversionService } from '../currency/currency-conversion.service';

/**
 * Multi-Currency Journal Entries Service
 * Handles journal entries in multiple currencies with automatic conversion
 * 
 * Supports recording transactions in USD or SYP with automatic conversion
 */

export interface MultiCurrencyJournalEntry {
  id: string;
  tenantId: string;
  entryNumber: string;
  entryDate: Date;
  description: string;
  currencyCode: string;
  exchangeRate: number;
  status: 'DRAFT' | 'POSTED' | 'CANCELLED';
  lines: MultiCurrencyJournalLine[];
  totalDebitSYP: number;
  totalCreditSYP: number;
  totalDebitUSD: number;
  totalCreditUSD: number;
  isBalanced: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MultiCurrencyJournalLine {
  id: string;
  journalEntryId: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debitSYP: number;
  creditSYP: number;
  debitUSD: number;
  creditUSD: number;
  currencyCode: string;
  description?: string;
}

export class MultiCurrencyJournalService {
  private currencyService = new CurrencyConversionService();

  /**
   * Create a multi-currency journal entry
   */
  async createJournalEntry(
    tenantId: string,
    entryNumber: string,
    entryDate: Date,
    description: string,
    currencyCode: string,
    lines: Array<{
      accountId: string;
      debitAmount: number;
      creditAmount: number;
      description?: string;
    }>,
    createdBy: string
  ): Promise<MultiCurrencyJournalEntry> {
    // Get exchange rate
    const exchangeRate = await this.currencyService.getExchangeRate(
      tenantId,
      currencyCode,
      'SYP',
      entryDate
    );

    if (!exchangeRate) {
      throw new Error('Exchange rate not found for the given date');
    }

    // Convert amounts to both currencies
    const convertedLines: MultiCurrencyJournalLine[] = [];
    let totalDebitSYP = 0;
    let totalCreditSYP = 0;
    let totalDebitUSD = 0;
    let totalCreditUSD = 0;

    for (const line of lines) {
      const account = await prisma.account.findUnique({
        where: { id: line.accountId }
      });

      if (!account) {
        throw new Error(`Account not found: ${line.accountId}`);
      }

      let debitSYP = 0;
      let creditSYP = 0;
      let debitUSD = 0;
      let creditUSD = 0;

      if (currencyCode === 'SYP') {
        debitSYP = line.debitAmount;
        creditSYP = line.creditAmount;
        debitUSD = line.debitAmount / exchangeRate.rate;
        creditUSD = line.creditAmount / exchangeRate.rate;
      } else {
        debitUSD = line.debitAmount;
        creditUSD = line.creditAmount;
        debitSYP = line.debitAmount * exchangeRate.rate;
        creditSYP = line.creditAmount * exchangeRate.rate;
      }

      totalDebitSYP += debitSYP;
      totalCreditSYP += creditSYP;
      totalDebitUSD += debitUSD;
      totalCreditUSD += creditUSD;

      convertedLines.push({
        id: crypto.randomUUID(),
        journalEntryId: '', // Will be set after entry creation
        accountId: line.accountId,
        accountCode: account.code,
        accountName: account.nameEn || account.nameAr,
        debitSYP,
        creditSYP,
        debitUSD,
        creditUSD,
        currencyCode,
        description: line.description
      });
    }

    const isBalanced = Math.abs(totalDebitSYP - totalCreditSYP) < 0.01;

    // In a real implementation, create in database
    return {
      id: crypto.randomUUID(),
      tenantId,
      entryNumber,
      entryDate,
      description,
      currencyCode,
      exchangeRate: exchangeRate.rate,
      status: 'DRAFT',
      lines: convertedLines,
      totalDebitSYP,
      totalCreditSYP,
      totalDebitUSD,
      totalCreditUSD,
      isBalanced,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Get journal entry by ID
   */
  async getJournalEntry(id: string): Promise<MultiCurrencyJournalEntry | null> {
    // In a real implementation, fetch from database
    return null;
  }

  /**
   * Get all journal entries for a tenant
   */
  async getJournalEntries(
    tenantId: string,
    status?: 'DRAFT' | 'POSTED' | 'CANCELLED',
    startDate?: Date,
    endDate?: Date
  ): Promise<MultiCurrencyJournalEntry[]> {
    // In a real implementation, fetch from database
    return [];
  }

  /**
   * Post a journal entry
   */
  async postJournalEntry(id: string): Promise<MultiCurrencyJournalEntry> {
    const entry = await this.getJournalEntry(id);
    if (!entry) {
      throw new Error('Journal entry not found');
    }

    if (!entry.isBalanced) {
      throw new Error('Cannot post unbalanced journal entry');
    }

    // In a real implementation, update status to POSTED
    return {
      ...entry,
      status: 'POSTED',
      updatedAt: new Date()
    };
  }

  /**
   * Cancel a journal entry
   */
  async cancelJournalEntry(id: string): Promise<MultiCurrencyJournalEntry> {
    const entry = await this.getJournalEntry(id);
    if (!entry) {
      throw new Error('Journal entry not found');
    }

    if (entry.status === 'CANCELLED') {
      throw new Error('Journal entry already cancelled');
    }

    // In a real implementation, update status to CANCELLED
    return {
      ...entry,
      status: 'CANCELLED',
      updatedAt: new Date()
    };
  }

  /**
   * Convert journal entry to different currency
   */
  async convertJournalEntry(
    entryId: string,
    targetCurrencyCode: string,
    asOfDate: Date
  ): Promise<MultiCurrencyJournalEntry> {
    const entry = await this.getJournalEntry(entryId);
    if (!entry) {
      throw new Error('Journal entry not found');
    }

    // Get exchange rate
    const exchangeRate = await this.currencyService.getExchangeRate(
      entry.tenantId,
      entry.currencyCode,
      targetCurrencyCode,
      asOfDate
    );

    if (!exchangeRate) {
      throw new Error('Exchange rate not found');
    }

    // Convert all line amounts
    const convertedLines = entry.lines.map(line => {
      let debitTarget = 0;
      let creditTarget = 0;

      if (entry.currencyCode === 'SYP' && targetCurrencyCode === 'USD') {
        debitTarget = line.debitSYP / exchangeRate.rate;
        creditTarget = line.creditSYP / exchangeRate.rate;
      } else if (entry.currencyCode === 'USD' && targetCurrencyCode === 'SYP') {
        debitTarget = line.debitUSD * exchangeRate.rate;
        creditTarget = line.creditUSD * exchangeRate.rate;
      }

      return {
        ...line,
        debitSYP: targetCurrencyCode === 'SYP' ? debitTarget : line.debitSYP,
        creditSYP: targetCurrencyCode === 'SYP' ? creditTarget : line.creditSYP,
        debitUSD: targetCurrencyCode === 'USD' ? debitTarget : line.debitUSD,
        creditUSD: targetCurrencyCode === 'USD' ? creditTarget : line.creditUSD
      };
    });

    return {
      ...entry,
      currencyCode: targetCurrencyCode,
      exchangeRate: exchangeRate.rate,
      lines: convertedLines,
      totalDebitSYP: convertedLines.reduce((sum, l) => sum + l.debitSYP, 0),
      totalCreditSYP: convertedLines.reduce((sum, l) => sum + l.creditSYP, 0),
      totalDebitUSD: convertedLines.reduce((sum, l) => sum + l.debitUSD, 0),
      totalCreditUSD: convertedLines.reduce((sum, l) => sum + l.creditUSD, 0),
      updatedAt: new Date()
    };
  }

  /**
   * Get currency summary for journal entries
   */
  async getCurrencySummary(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalEntries: number;
    sypEntries: number;
    usdEntries: number;
    totalDebitSYP: number;
    totalCreditSYP: number;
    totalDebitUSD: number;
    totalCreditUSD: number;
  }> {
    const entries = await this.getJournalEntries(tenantId, undefined, startDate, endDate);

    const sypEntries = entries.filter(e => e.currencyCode === 'SYP').length;
    const usdEntries = entries.filter(e => e.currencyCode === 'USD').length;

    const totalDebitSYP = entries.reduce((sum, e) => sum + e.totalDebitSYP, 0);
    const totalCreditSYP = entries.reduce((sum, e) => sum + e.totalCreditSYP, 0);
    const totalDebitUSD = entries.reduce((sum, e) => sum + e.totalDebitUSD, 0);
    const totalCreditUSD = entries.reduce((sum, e) => sum + e.totalCreditUSD, 0);

    return {
      totalEntries: entries.length,
      sypEntries,
      usdEntries,
      totalDebitSYP,
      totalCreditSYP,
      totalDebitUSD,
      totalCreditUSD
    };
  }

  /**
   * Validate journal entry balance
   */
  async validateBalance(entryId: string): Promise<{
    isBalanced: boolean;
    debitSYP: number;
    creditSYP: number;
    differenceSYP: number;
    debitUSD: number;
    creditUSD: number;
    differenceUSD: number;
  }> {
    const entry = await this.getJournalEntry(entryId);
    if (!entry) {
      throw new Error('Journal entry not found');
    }

    const differenceSYP = entry.totalDebitSYP - entry.totalCreditSYP;
    const differenceUSD = entry.totalDebitUSD - entry.totalCreditUSD;
    const isBalanced = Math.abs(differenceSYP) < 0.01 && Math.abs(differenceUSD) < 0.01;

    return {
      isBalanced,
      debitSYP: entry.totalDebitSYP,
      creditSYP: entry.totalCreditSYP,
      differenceSYP,
      debitUSD: entry.totalDebitUSD,
      creditUSD: entry.totalCreditUSD,
      differenceUSD
    };
  }
}

export default new MultiCurrencyJournalService();
