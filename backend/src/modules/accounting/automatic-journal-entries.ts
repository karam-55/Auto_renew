import { AccountType } from '@prisma/client';
import prisma from '../../config/database';

/**
 * Automatic Journal Entry Service
 * Handles automatic creation of journal entries for business events
 * 
 * This service creates accounting entries for:
 * - Invoice issuance (accounts receivable + revenue)
 * - Payment receipt (cash/bank + accounts receivable)
 * - Cheque operations (deposit, clearance, bounce)
 * - Installment payments
 * - Expense payments
 * - Journal entry reversals
 */

// Default Account Codes (can be overridden per tenant)
const DEFAULT_ACCOUNT_CODES = {
  // Assets
  CASH: '1000',
  BANK: '1100',
  INVENTORY: '1200',
  ACCOUNTS_RECEIVABLE: '1300',
  CHEQUES_RECEIVABLE: '1400',

  // Liabilities
  ACCOUNTS_PAYABLE: '2000',
  CHEQUES_PAYABLE: '2100',
  VAT_PAYABLE: '2200',
  INSTALLMENTS_PAYABLE: '2300',
  PAYROLL_PAYABLE: '2400',

  // Equity
  CAPITAL: '3000',
  RETAINED_EARNINGS: '3100',

  // Revenue
  SERVICE_REVENUE: '4000',
  PARTS_REVENUE: '4100',
  DISCOUNT_REVENUE: '4200',

  // Expenses
  COST_OF_GOODS_SOLD: '5000',
  LABOR_EXPENSE: '5100',
  RENT_EXPENSE: '5200',
  UTILITIES_EXPENSE: '5300',
  SUPPLIES_EXPENSE: '5400',
  DISCOUNT_EXPENSE: '5500',
  BANK_CHARGES_EXPENSE: '5600',
  PAYROLL_EXPENSE: '5700',
  DEPRECIATION_EXPENSE: '5800',
  ACCUMULATED_DEPRECIATION: '1900',
};

/**
 * Journal Line Interface
 */
interface JournalLineInput {
  accountId: string;
  debitSYP: number;
  debitUSD: number;
  creditSYP: number;
  creditUSD: number;
  description?: string;
  sourceType?: string | null;
  sourceId?: string | null;
}

/**
 * Auto-create default accounts if missing for a tenant
 */
export async function ensureDefaultAccounts(tenantId: string): Promise<void> {
  const defaults = [
    { code: DEFAULT_ACCOUNT_CODES.CASH, nameAr: 'الصندوق', nameEn: 'Cash', accountType: AccountType.ASSET },
    { code: DEFAULT_ACCOUNT_CODES.BANK, nameAr: 'البنك', nameEn: 'Bank', accountType: AccountType.ASSET },
    { code: DEFAULT_ACCOUNT_CODES.INVENTORY, nameAr: 'المخزون', nameEn: 'Inventory', accountType: AccountType.ASSET },
    { code: DEFAULT_ACCOUNT_CODES.ACCOUNTS_RECEIVABLE, nameAr: 'العملاء', nameEn: 'Accounts Receivable', accountType: AccountType.ASSET },
    { code: DEFAULT_ACCOUNT_CODES.CHEQUES_RECEIVABLE, nameAr: 'شيكات تحت التحصيل', nameEn: 'Cheques Receivable', accountType: AccountType.ASSET },
    { code: DEFAULT_ACCOUNT_CODES.ACCOUNTS_PAYABLE, nameAr: 'الموردين', nameEn: 'Accounts Payable', accountType: AccountType.LIABILITY },
    { code: DEFAULT_ACCOUNT_CODES.VAT_PAYABLE, nameAr: 'ضريبة القيمة المضافة مستحقة', nameEn: 'VAT Payable', accountType: AccountType.LIABILITY },
    { code: DEFAULT_ACCOUNT_CODES.INSTALLMENTS_PAYABLE, nameAr: 'أقساط مستحقة', nameEn: 'Installments Payable', accountType: AccountType.LIABILITY },
    { code: DEFAULT_ACCOUNT_CODES.SERVICE_REVENUE, nameAr: 'إيرادات الخدمات', nameEn: 'Service Revenue', accountType: AccountType.REVENUE },
    { code: DEFAULT_ACCOUNT_CODES.PARTS_REVENUE, nameAr: 'إيرادات القطع', nameEn: 'Parts Revenue', accountType: AccountType.REVENUE },
    { code: DEFAULT_ACCOUNT_CODES.DISCOUNT_REVENUE, nameAr: 'خصومات مكتسبة', nameEn: 'Discount Revenue', accountType: AccountType.REVENUE },
    { code: DEFAULT_ACCOUNT_CODES.COST_OF_GOODS_SOLD, nameAr: 'تكلفة البضاعة المباعة', nameEn: 'Cost of Goods Sold', accountType: AccountType.COGS },
    { code: DEFAULT_ACCOUNT_CODES.DISCOUNT_EXPENSE, nameAr: 'خصم مسموح به', nameEn: 'Discount Allowed', accountType: AccountType.EXPENSE },
    { code: DEFAULT_ACCOUNT_CODES.BANK_CHARGES_EXPENSE, nameAr: 'مصاريف بنكية', nameEn: 'Bank Charges', accountType: AccountType.EXPENSE },
    { code: DEFAULT_ACCOUNT_CODES.PAYROLL_EXPENSE, nameAr: 'مصاريف رواتب', nameEn: 'Payroll Expense', accountType: AccountType.EXPENSE },
    { code: DEFAULT_ACCOUNT_CODES.DEPRECIATION_EXPENSE, nameAr: 'مصاريف الإهلاك', nameEn: 'Depreciation Expense', accountType: AccountType.EXPENSE },
    { code: DEFAULT_ACCOUNT_CODES.ACCUMULATED_DEPRECIATION, nameAr: 'مجمع الإهلاك', nameEn: 'Accumulated Depreciation', accountType: AccountType.ASSET },
  ];

  for (const acc of defaults) {
    await prisma.account.upsert({
      where: { tenantId_code: { tenantId, code: acc.code } },
      update: {},
      create: {
        tenantId,
        code: acc.code,
        nameAr: acc.nameAr,
        nameEn: acc.nameEn,
        accountType: acc.accountType,
        isActive: true,
      },
    });
  }
}

/**
 * Get account ID by code for a specific tenant
 * @param tenantId - The tenant ID
 * @param code - The account code
 * @returns The account ID or null if not found
 */
export async function getAccountIdByCode(tenantId: string, code: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: {
      tenantId,
      code,
      isActive: true,
    },
    select: { id: true },
  });
  
  return account?.id || null;
}

/**
 * Get default exchange rate between two currencies
 * @param tenantId - The tenant ID
 * @param fromCurrencyId - Source currency ID
 * @param toCurrencyId - Target currency ID
 * @returns The exchange rate or 1 if not found
 */
async function getDefaultExchangeRate(
  tenantId: string,
  fromCurrencyId: string,
  toCurrencyId: string
): Promise<number> {
  if (fromCurrencyId === toCurrencyId) {
    return 1;
  }

  const exchangeRate = await prisma.exchangeRate.findFirst({
    where: {
      tenantId,
      fromCurrencyId,
      toCurrencyId,
      effectiveDate: { lte: new Date() },
    },
    orderBy: { effectiveDate: 'desc' },
  });

  return exchangeRate ? Number(exchangeRate.rate) : 1;
}

/**
 * Get open fiscal period for a specific date
 * @param tenantId - The tenant ID
 * @param date - The date to check
 * @returns The fiscal period or null if not found
 */
export async function getOpenFiscalPeriod(tenantId: string, date: Date): Promise<any | null> {
  const fiscalPeriod = await prisma.fiscalPeriod.findFirst({
    where: {
      tenantId,
      startDate: { lte: date },
      endDate: { gte: date },
      isClosed: false,
    },
  });

  return fiscalPeriod;
}

/**
 * Create a journal entry with its lines
 * @param tenantId - The tenant ID
 * @param entryDate - The entry date
 * @param description - Entry description
 * @param reference - Optional reference number
 * @param sourceType - Optional source type (e.g., 'INVOICE', 'PAYMENT')
 * @param sourceId - Optional source ID
 * @param createdById - Optional user ID who created the entry
 * @param lines - Array of journal lines
 * @returns The created journal entry
 * @throws Error if entry doesn't balance or fiscal period is closed
 */
export async function createJournalEntry(
  tenantId: string,
  entryDate: Date,
  description: string,
  reference: string | null = null,
  sourceType: string | null = null,
  sourceId: string | null = null,
  createdById: string | null = null,
  lines: JournalLineInput[]
): Promise<any> {
  // Idempotency check: if a journal entry with the same sourceType and sourceId exists, return it
  if (sourceType && sourceId) {
    const existingEntry = await prisma.journalEntry.findFirst({
      where: {
        tenantId,
        sourceType,
        sourceId,
      },
    });

    if (existingEntry) {
      return existingEntry;
    }
  }

  // Validate that entry balances
  const totalDebitSYP = lines.reduce((sum, line) => sum + line.debitSYP, 0);
  const totalCreditSYP = lines.reduce((sum, line) => sum + line.creditSYP, 0);
  const totalDebitUSD = lines.reduce((sum, line) => sum + line.debitUSD, 0);
  const totalCreditUSD = lines.reduce((sum, line) => sum + line.creditUSD, 0);

  if (Math.abs(totalDebitSYP - totalCreditSYP) > 0.01) {
    throw new Error(`Journal entry does not balance in SYP: Debit ${totalDebitSYP} != Credit ${totalCreditSYP}`);
  }

  if (Math.abs(totalDebitUSD - totalCreditUSD) > 0.01) {
    throw new Error(`Journal entry does not balance in USD: Debit ${totalDebitUSD} != Credit ${totalCreditUSD}`);
  }

  // Check fiscal period
  const fiscalPeriod = await getOpenFiscalPeriod(tenantId, entryDate);
  if (!fiscalPeriod) {
    throw new Error('No open fiscal period found for the entry date');
  }

  // Create journal entry
  const journalEntry = await prisma.journalEntry.create({
    data: {
      tenantId,
      entryDate,
      description,
      reference: reference || undefined,
      fiscalPeriodId: fiscalPeriod.id,
      sourceType: sourceType || undefined,
      sourceId: sourceId || undefined,
      createdById: createdById || undefined,
    },
  });

  // Create journal lines
  await prisma.journalLine.createMany({
    data: lines.map((line, index) => ({
      entryId: journalEntry.id,
      accountId: line.accountId,
      accountName: line.description || description,
      debitSYP: line.debitSYP,
      debitUSD: line.debitUSD,
      creditSYP: line.creditSYP,
      creditUSD: line.creditUSD,
      description: line.description,
      sourceType: (line.sourceType || sourceType) || undefined,
      sourceId: (line.sourceId || sourceId) || undefined,
    })),
  });

  // Update account balances
  for (const line of lines) {
    await updateAccountBalance(line.accountId, line.debitSYP, line.creditSYP, line.debitUSD, line.creditUSD);
  }

  return journalEntry;
}

/**
 * Update account balance based on debit/credit amounts
 * @param accountId - The account ID
 * @param debitSYP - Debit amount in SYP
 * @param creditSYP - Credit amount in SYP
 * @param debitUSD - Debit amount in USD
 * @param creditUSD - Credit amount in USD
 */
export async function updateAccountBalance(
  accountId: string,
  debitSYP: number,
  creditSYP: number,
  debitUSD: number,
  creditUSD: number
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const account = await tx.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    const currentBalanceSYP = Number(account.balanceSYP);
    const currentBalanceUSD = Number(account.balanceUSD);

    let newBalanceSYP = currentBalanceSYP;
    let newBalanceUSD = currentBalanceUSD;

    // Update balance based on account type
    if (
      account.accountType === AccountType.ASSET ||
      account.accountType === AccountType.COGS ||
      account.accountType === AccountType.EXPENSE
    ) {
      // For assets, COGS and expenses: debit increases balance, credit decreases
      newBalanceSYP = currentBalanceSYP + debitSYP - creditSYP;
      newBalanceUSD = currentBalanceUSD + debitUSD - creditUSD;
    } else {
      // For liabilities, equity, revenue: credit increases balance, debit decreases
      newBalanceSYP = currentBalanceSYP - debitSYP + creditSYP;
      newBalanceUSD = currentBalanceUSD - debitUSD + creditUSD;
    }

    await tx.account.update({
      where: { id: accountId },
      data: {
        balanceSYP: newBalanceSYP,
        balanceUSD: newBalanceUSD,
      },
    });
  });
}

/**
 * Create journal entry for invoice (accounts receivable + revenue)
 * @param invoice - The invoice object
 * @param tenantId - The tenant ID
 * @param createdById - Optional user ID who created the entry
 * @returns The created journal entry
 */
export async function createInvoiceJournalEntry(
  invoice: any,
  tenantId: string,
  createdById: string | null = null
): Promise<any> {
  // Get fiscal period for invoice date
  const fiscalPeriod = await getOpenFiscalPeriod(tenantId, invoice.invoiceDate);
  if (!fiscalPeriod) {
    throw new Error('No open fiscal period found for invoice date');
  }

  // Get account codes
  const arAccountId = await getAccountIdByCode(tenantId, DEFAULT_ACCOUNT_CODES.ACCOUNTS_RECEIVABLE);
  const serviceRevenueAccountId = await getAccountIdByCode(tenantId, DEFAULT_ACCOUNT_CODES.SERVICE_REVENUE);
  const partsRevenueAccountId = await getAccountIdByCode(tenantId, DEFAULT_ACCOUNT_CODES.PARTS_REVENUE);
  const discountRevenueAccountId = await getAccountIdByCode(tenantId, DEFAULT_ACCOUNT_CODES.DISCOUNT_REVENUE);
  const vatPayableAccountId = await getAccountIdByCode(tenantId, DEFAULT_ACCOUNT_CODES.VAT_PAYABLE);

  if (!arAccountId || !serviceRevenueAccountId || !partsRevenueAccountId) {
    throw new Error('Required accounts not found. Please set up chart of accounts.');
  }

  // Build journal lines
  const lines: JournalLineInput[] = [
    {
      accountId: arAccountId,
      debitSYP: Number(invoice.totalSYP),
      debitUSD: Number(invoice.totalUSD || 0),
      creditSYP: 0,
      creditUSD: 0,
      description: `Invoice ${invoice.invoiceNumber}`,
      sourceType: 'INVOICE',
      sourceId: invoice.id,
    },
  ];

  // Add revenue lines based on invoice items
  if (invoice.items && Array.isArray(invoice.items)) {
    for (const item of invoice.items) {
      // Determine revenue account: if serviceId exists it's a service, if partId exists it's a part
      const revenueAccountId = item.serviceId ? serviceRevenueAccountId : partsRevenueAccountId;
      const totalSYP = Number(item.priceSYP) * item.quantity;
      const totalUSD = Number(item.priceUSD || 0) * item.quantity;

      lines.push({
        accountId: revenueAccountId,
        debitSYP: 0,
        debitUSD: 0,
        creditSYP: totalSYP,
        creditUSD: totalUSD,
        description: item.description || item.itemName,
        sourceType: 'INVOICE',
        sourceId: invoice.id,
      });
    }
  }

  // Add tax/VAT payable if any
  if (Number(invoice.taxSYP) > 0 && vatPayableAccountId) {
    lines.push({
      accountId: vatPayableAccountId,
      debitSYP: 0,
      debitUSD: 0,
      creditSYP: Number(invoice.taxSYP),
      creditUSD: Number(invoice.taxUSD || 0),
      description: `VAT/Tax on Invoice ${invoice.invoiceNumber}`,
      sourceType: 'INVOICE',
      sourceId: invoice.id,
    });
  }

  // Add discount if any (debit contra-revenue to reduce net revenue)
  if (Number(invoice.discountSYP) > 0) {
    lines.push({
      accountId: discountRevenueAccountId!,
      debitSYP: Number(invoice.discountSYP),
      debitUSD: Number(invoice.discountUSD || 0),
      creditSYP: 0,
      creditUSD: 0,
      description: 'Sales Discount',
      sourceType: 'INVOICE',
      sourceId: invoice.id,
    });
  }

  return createJournalEntry(
    tenantId,
    invoice.invoiceDate,
    `Invoice ${invoice.invoiceNumber} - ${invoice.customer?.name || 'Customer'}`,
    invoice.invoiceNumber,
    'INVOICE',
    invoice.id,
    createdById,
    lines
  );
}

/**
 * Create journal entry for payment received (cash/bank + accounts receivable)
 * @param payment - The payment object
 * @param tenantId - The tenant ID
 * @param createdById - Optional user ID who created the entry
 * @returns The created journal entry
 */
export async function createPaymentReceivedJournalEntry(
  payment: any,
  tenantId: string,
  createdById: string | null = null
): Promise<any> {
  // Get fiscal period for payment date
  const fiscalPeriod = await getOpenFiscalPeriod(tenantId, payment.paymentDate);
  if (!fiscalPeriod) {
    throw new Error('No open fiscal period found for payment date');
  }

  // Get account codes based on payment method
  const cashAccountId = await getAccountIdByCode(tenantId, DEFAULT_ACCOUNT_CODES.CASH);
  const bankAccountId = await getAccountIdByCode(tenantId, DEFAULT_ACCOUNT_CODES.BANK);
  const arAccountId = await getAccountIdByCode(tenantId, DEFAULT_ACCOUNT_CODES.ACCOUNTS_RECEIVABLE);
  const discountExpenseAccountId = await getAccountIdByCode(tenantId, DEFAULT_ACCOUNT_CODES.DISCOUNT_EXPENSE);

  if (!cashAccountId || !bankAccountId || !arAccountId) {
    throw new Error('Required accounts not found. Please set up chart of accounts.');
  }

  const debitAccountId = payment.paymentMethod === 'CASH' ? cashAccountId : bankAccountId;
  const amountSYP = Number(payment.amountSYP);
  const amountUSD = Number(payment.amountUSD || 0);
  const discountSYP = Number(payment.discountSYP || 0);
  const discountUSD = Number(payment.discountUSD || 0);

  // AR credit must equal cash received + discount (full invoice balance)
  const arCreditSYP = amountSYP + discountSYP;
  const arCreditUSD = amountUSD + discountUSD;

  const lines: JournalLineInput[] = [
    {
      accountId: debitAccountId,
      debitSYP: amountSYP,
      debitUSD: amountUSD,
      creditSYP: 0,
      creditUSD: 0,
      description: `Payment received - ${payment.paymentMethod}`,
      sourceType: 'PAYMENT',
      sourceId: payment.id,
    },
    {
      accountId: arAccountId,
      debitSYP: 0,
      debitUSD: 0,
      creditSYP: arCreditSYP,
      creditUSD: arCreditUSD,
      description: `Payment for invoice ${payment.invoiceNumber || payment.reference}`,
      sourceType: 'PAYMENT',
      sourceId: payment.id,
    },
  ];

  // Add discount if any (debit discount expense, AR already includes it)
  if (discountSYP > 0) {
    lines.push({
      accountId: discountExpenseAccountId!,
      debitSYP: discountSYP,
      debitUSD: discountUSD,
      creditSYP: 0,
      creditUSD: 0,
      description: 'Early payment discount',
      sourceType: 'PAYMENT',
      sourceId: payment.id,
    });
  }

  return createJournalEntry(
    tenantId,
    payment.paymentDate,
    `Payment received - ${payment.paymentNumber || payment.reference}`,
    payment.paymentNumber || payment.reference,
    'PAYMENT',
    payment.id,
    createdById,
    lines
  );
}

/**
 * Create journal entry for GRN (inventory increase + accounts payable)
 * @param grn - The GRN object
 * @param tenantId - The tenant ID
 * @param createdById - Optional user ID who created the entry
 * @returns The created journal entry
 */
export async function createGRNJournalEntry(
  grn: any,
  tenantId: string,
  createdById: string | null = null
): Promise<any> {
  // Get fiscal period for GRN date
  const fiscalPeriod = await getOpenFiscalPeriod(tenantId, grn.receivedDate);
  if (!fiscalPeriod) {
    throw new Error('No open fiscal period found for GRN date');
  }

  // Get account codes
  const inventoryAccountId = await getAccountIdByCode(tenantId, DEFAULT_ACCOUNT_CODES.INVENTORY);
  const accountsPayableAccountId = await getAccountIdByCode(tenantId, DEFAULT_ACCOUNT_CODES.ACCOUNTS_PAYABLE);

  if (!inventoryAccountId || !accountsPayableAccountId) {
    throw new Error('Required accounts not found. Please set up chart of accounts.');
  }

  // Calculate total from GRN lines
  const totalCost = grn.lines?.reduce((sum: number, line: any) => sum + (line.receivedQuantity * line.unitCost), 0) || 0;

  const lines: JournalLineInput[] = [
    {
      accountId: inventoryAccountId,
      debitSYP: totalCost,
      debitUSD: 0,
      creditSYP: 0,
      creditUSD: 0,
      description: `Inventory received via GRN ${grn.grnNumber}`,
      sourceType: 'GRN',
      sourceId: grn.id,
    },
    {
      accountId: accountsPayableAccountId,
      debitSYP: 0,
      debitUSD: 0,
      creditSYP: totalCost,
      creditUSD: 0,
      description: `Supplier payable for GRN ${grn.grnNumber}`,
      sourceType: 'GRN',
      sourceId: grn.id,
    },
  ];

  return createJournalEntry(
    tenantId,
    grn.receivedDate,
    `GRN ${grn.grnNumber} - ${grn.supplier?.name || 'Supplier'}`,
    grn.grnNumber,
    'GRN',
    grn.id,
    createdById,
    lines
  );
}

/**
 * Create journal entry for stock consumption (COGS + inventory reduction)
 * @param transaction - The inventory transaction object
 * @param tenantId - The tenant ID
 * @param createdById - Optional user ID who created the entry
 * @returns The created journal entry
 */
export async function createStockConsumptionJournalEntry(
  transaction: any,
  tenantId: string,
  createdById: string | null = null
): Promise<any> {
  // Get fiscal period for transaction date
  const fiscalPeriod = await getOpenFiscalPeriod(tenantId, transaction.createdAt);
  if (!fiscalPeriod) {
    throw new Error('No open fiscal period found for transaction date');
  }

  // Get account codes
  const inventoryAccountId = await getAccountIdByCode(tenantId, DEFAULT_ACCOUNT_CODES.INVENTORY);
  const costOfGoodsSoldAccountId = await getAccountIdByCode(tenantId, DEFAULT_ACCOUNT_CODES.COST_OF_GOODS_SOLD);

  if (!inventoryAccountId || !costOfGoodsSoldAccountId) {
    throw new Error('Required accounts not found. Please set up chart of accounts.');
  }

  const totalCost = Number(transaction.costSYP) * transaction.quantity;

  const lines: JournalLineInput[] = [
    {
      accountId: costOfGoodsSoldAccountId,
      debitSYP: totalCost,
      debitUSD: 0,
      creditSYP: 0,
      creditUSD: 0,
      description: `COGS for ${transaction.type} - ${transaction.part?.name || 'Part'}`,
      sourceType: 'INVENTORY_TRANSACTION',
      sourceId: transaction.id,
    },
    {
      accountId: inventoryAccountId,
      debitSYP: 0,
      debitUSD: 0,
      creditSYP: totalCost,
      creditUSD: 0,
      description: `Inventory reduction for ${transaction.type}`,
      sourceType: 'INVENTORY_TRANSACTION',
      sourceId: transaction.id,
    },
  ];

  return createJournalEntry(
    tenantId,
    transaction.createdAt,
    `Stock consumption - ${transaction.type}`,
    transaction.reference,
    'INVENTORY_TRANSACTION',
    transaction.id,
    createdById,
    lines
  );
}

/**
 * Create journal entry for cheque deposit
 * @param cheque - The cheque object
 * @param transaction - The cheque transaction object
 * @param tenantId - The tenant ID
 * @param createdById - Optional user ID who created the entry
 * @returns The created journal entry
 */
export async function createChequeDepositJournalEntry(
  cheque: any,
  transaction: any,
  tenantId: string,
  createdById: string | null = null
): Promise<any> {
  // Get fiscal period for transaction date
  const fiscalPeriod = await getOpenFiscalPeriod(tenantId, transaction.transactionDate);
  if (!fiscalPeriod) {
    throw new Error('No open fiscal period found for transaction date');
  }

  // Get account codes
  const chequesReceivableAccountId = await getAccountIdByCode(tenantId, DEFAULT_ACCOUNT_CODES.CHEQUES_RECEIVABLE);
  const arAccountId = await getAccountIdByCode(tenantId, DEFAULT_ACCOUNT_CODES.ACCOUNTS_RECEIVABLE);

  if (!chequesReceivableAccountId || !arAccountId) {
    throw new Error('Required accounts not found. Please set up chart of accounts.');
  }

  const amountSYP = Number(cheque.amountSYP);
  const amountUSD = Number(cheque.amountUSD || 0);

  const lines: JournalLineInput[] = [
    {
      accountId: chequesReceivableAccountId,
      debitSYP: amountSYP,
      debitUSD: amountUSD,
      creditSYP: 0,
      creditUSD: 0,
      description: `Cheque ${cheque.chequeNumber} received`,
      sourceType: 'CHEQUE',
      sourceId: cheque.id,
    },
    {
      accountId: arAccountId,
      debitSYP: 0,
      debitUSD: 0,
      creditSYP: amountSYP,
      creditUSD: amountUSD,
      description: `Cheque from ${cheque.receiverName || cheque.issuerName}`,
      sourceType: 'CHEQUE',
      sourceId: cheque.id,
    },
  ];

  return createJournalEntry(
    tenantId,
    transaction.transactionDate,
    `Cheque received - ${cheque.chequeNumber}`,
    cheque.chequeNumber,
    'CHEQUE',
    cheque.id,
    createdById,
    lines
  );
}

/**
 * Create journal entry for cheque clearance
 * @param cheque - The cheque object
 * @param transaction - The cheque transaction object
 * @param tenantId - The tenant ID
 * @param createdById - Optional user ID who created the entry
 * @returns The created journal entry
 */
export async function createChequeClearanceJournalEntry(
  cheque: any,
  transaction: any,
  tenantId: string,
  createdById: string | null = null
): Promise<any> {
  // Get fiscal period for transaction date
  const fiscalPeriod = await getOpenFiscalPeriod(tenantId, transaction.transactionDate);
  if (!fiscalPeriod) {
    throw new Error('No open fiscal period found for transaction date');
  }

  // Get account codes
  const bankAccountId = await getAccountIdByCode(tenantId, DEFAULT_ACCOUNT_CODES.BANK);
  const chequesReceivableAccountId = await getAccountIdByCode(tenantId, DEFAULT_ACCOUNT_CODES.CHEQUES_RECEIVABLE);
  const bankChargesAccountId = await getAccountIdByCode(tenantId, DEFAULT_ACCOUNT_CODES.BANK_CHARGES_EXPENSE);

  if (!bankAccountId || !chequesReceivableAccountId) {
    throw new Error('Required accounts not found. Please set up chart of accounts.');
  }

  const amountSYP = Number(cheque.amountSYP);
  const amountUSD = Number(cheque.amountUSD || 0);
  const bankFeeSYP = Number(transaction.bankFeeSYP || 0);
  const bankFeeUSD = Number(transaction.bankFeeUSD || 0);

  const lines: JournalLineInput[] = [
    {
      accountId: bankAccountId,
      debitSYP: amountSYP - bankFeeSYP,
      debitUSD: amountUSD - bankFeeUSD,
      creditSYP: 0,
      creditUSD: 0,
      description: `Cheque ${cheque.chequeNumber} cleared`,
      sourceType: 'CHEQUE_TRANSACTION',
      sourceId: transaction.id,
    },
    {
      accountId: chequesReceivableAccountId,
      debitSYP: 0,
      debitUSD: 0,
      creditSYP: amountSYP,
      creditUSD: amountUSD,
      description: `Cheque clearance`,
      sourceType: 'CHEQUE_TRANSACTION',
      sourceId: transaction.id,
    },
  ];

  // Add bank charges if any
  if (bankFeeSYP > 0) {
    lines.push({
      accountId: bankChargesAccountId!,
      debitSYP: bankFeeSYP,
      debitUSD: bankFeeUSD,
      creditSYP: 0,
      creditUSD: 0,
      description: 'Bank charges for cheque clearance',
      sourceType: 'CHEQUE_TRANSACTION',
      sourceId: transaction.id,
    });
  }

  return createJournalEntry(
    tenantId,
    transaction.transactionDate,
    `Cheque cleared - ${cheque.chequeNumber}`,
    transaction.reference,
    'CHEQUE_TRANSACTION',
    transaction.id,
    createdById,
    lines
  );
}

/**
 * Create journal entry for cheque bounce
 * @param cheque - The cheque object
 * @param transaction - The cheque transaction object
 * @param tenantId - The tenant ID
 * @param createdById - Optional user ID who created the entry
 * @returns The created journal entry
 */
export async function createChequeBounceJournalEntry(
  cheque: any,
  transaction: any,
  tenantId: string,
  createdById: string | null = null
): Promise<any> {
  // Get fiscal period for transaction date
  const fiscalPeriod = await getOpenFiscalPeriod(tenantId, transaction.transactionDate);
  if (!fiscalPeriod) {
    throw new Error('No open fiscal period found for transaction date');
  }

  // Get account codes
  const arAccountId = await getAccountIdByCode(tenantId, DEFAULT_ACCOUNT_CODES.ACCOUNTS_RECEIVABLE);
  const chequesReceivableAccountId = await getAccountIdByCode(tenantId, DEFAULT_ACCOUNT_CODES.CHEQUES_RECEIVABLE);
  const bankChargesAccountId = await getAccountIdByCode(tenantId, DEFAULT_ACCOUNT_CODES.BANK_CHARGES_EXPENSE);

  if (!arAccountId || !chequesReceivableAccountId) {
    throw new Error('Required accounts not found. Please set up chart of accounts.');
  }

  const amountSYP = Number(cheque.amountSYP);
  const amountUSD = Number(cheque.amountUSD || 0);
  const bankFeeSYP = Number(transaction.bankFeeSYP || 0);
  const bankFeeUSD = Number(transaction.bankFeeUSD || 0);

  const lines: JournalLineInput[] = [
    {
      accountId: arAccountId,
      debitSYP: amountSYP,
      debitUSD: amountUSD,
      creditSYP: 0,
      creditUSD: 0,
      description: `Cheque ${cheque.chequeNumber} bounced - returned to receivables`,
      sourceType: 'CHEQUE_TRANSACTION',
      sourceId: transaction.id,
    },
    {
      accountId: chequesReceivableAccountId,
      debitSYP: 0,
      debitUSD: 0,
      creditSYP: amountSYP,
      creditUSD: amountUSD,
      description: `Cheque bounce reversal`,
      sourceType: 'CHEQUE_TRANSACTION',
      sourceId: transaction.id,
    },
  ];

  // Add bank charges if any
  if (bankFeeSYP > 0) {
    lines.push({
      accountId: bankChargesAccountId!,
      debitSYP: bankFeeSYP,
      debitUSD: bankFeeUSD,
      creditSYP: 0,
      creditUSD: 0,
      description: 'Bank charges for bounced cheque',
      sourceType: 'CHEQUE_TRANSACTION',
      sourceId: transaction.id,
    });
  }

  return createJournalEntry(
    tenantId,
    transaction.transactionDate,
    `Cheque bounced - ${cheque.chequeNumber}`,
    transaction.reference,
    'CHEQUE_TRANSACTION',
    transaction.id,
    createdById,
    lines
  );
}

/**
 * Create journal entry for installment payment
 * @param installment - The installment object
 * @param tenantId - The tenant ID
 * @param createdById - Optional user ID who created the entry
 * @returns The created journal entry
 */
export async function createInstallmentPaymentJournalEntry(
  installment: any,
  tenantId: string,
  createdById: string | null = null
): Promise<any> {
  // Get fiscal period for payment date
  const paymentDate = installment.paidAt || new Date();
  const fiscalPeriod = await getOpenFiscalPeriod(tenantId, paymentDate);
  if (!fiscalPeriod) {
    throw new Error('No open fiscal period found for installment payment date');
  }

  // Get account codes
  const cashAccountId = await getAccountIdByCode(tenantId, DEFAULT_ACCOUNT_CODES.CASH);
  const bankAccountId = await getAccountIdByCode(tenantId, DEFAULT_ACCOUNT_CODES.BANK);
  const installmentsPayableAccountId = await getAccountIdByCode(tenantId, DEFAULT_ACCOUNT_CODES.INSTALLMENTS_PAYABLE);

  if (!cashAccountId || !bankAccountId || !installmentsPayableAccountId) {
    throw new Error('Required accounts not found. Please set up chart of accounts.');
  }

  // Assuming payment method is CASH by default (can be enhanced)
  const debitAccountId = cashAccountId;
  const paidSYP = Number(installment.paidSYP);
  const paidUSD = Number(installment.paidUSD || 0);

  const lines: JournalLineInput[] = [
    {
      accountId: debitAccountId,
      debitSYP: paidSYP,
      debitUSD: paidUSD,
      creditSYP: 0,
      creditUSD: 0,
      description: `Installment payment #${installment.sequenceNumber}`,
      sourceType: 'INSTALLMENT',
      sourceId: installment.id,
    },
    {
      accountId: installmentsPayableAccountId,
      debitSYP: 0,
      debitUSD: 0,
      creditSYP: paidSYP,
      creditUSD: paidUSD,
      description: `Installment for plan ${installment.installmentPlanId}`,
      sourceType: 'INSTALLMENT',
      sourceId: installment.id,
    },
  ];

  return createJournalEntry(
    tenantId,
    paymentDate,
    `Installment payment - ${installment.sequenceNumber}`,
    `INST-${installment.sequenceNumber}`,
    'INSTALLMENT',
    installment.id,
    createdById,
    lines
  );
}

/**
 * Create journal entry for expense payment
 * @param tenantId - The tenant ID
 * @param expenseType - The type of expense (account code)
 * @param amountSYP - Amount in SYP
 * @param amountUSD - Amount in USD
 * @param description - Entry description
 * @param paymentMethod - Payment method (CASH or BANK)
 * @param reference - Optional reference
 * @param sourceType - Optional source type
 * @param sourceId - Optional source ID
 * @param createdById - Optional user ID who created the entry
 * @returns The created journal entry
 */
export async function createExpenseJournalEntry(
  tenantId: string,
  expenseType: keyof typeof DEFAULT_ACCOUNT_CODES,
  amountSYP: number,
  amountUSD: number,
  description: string,
  paymentMethod: 'CASH' | 'BANK',
  reference: string | null = null,
  sourceType: string | null = null,
  sourceId: string | null = null,
  createdById: string | null = null
): Promise<any> {
  // Get fiscal period
  const fiscalPeriod = await getOpenFiscalPeriod(tenantId, new Date());
  if (!fiscalPeriod) {
    throw new Error('No open fiscal period found');
  }

  // Get account codes
  const cashAccountId = await getAccountIdByCode(tenantId, DEFAULT_ACCOUNT_CODES.CASH);
  const bankAccountId = await getAccountIdByCode(tenantId, DEFAULT_ACCOUNT_CODES.BANK);
  const expenseAccountId = await getAccountIdByCode(tenantId, DEFAULT_ACCOUNT_CODES[expenseType]);

  if (!cashAccountId || !bankAccountId || !expenseAccountId) {
    throw new Error('Required accounts not found. Please set up chart of accounts.');
  }

  const creditAccountId = paymentMethod === 'CASH' ? cashAccountId : bankAccountId;

  const lines: JournalLineInput[] = [
    {
      accountId: expenseAccountId,
      debitSYP: amountSYP,
      debitUSD: amountUSD,
      creditSYP: 0,
      creditUSD: 0,
      description,
      sourceType,
      sourceId,
    },
    {
      accountId: creditAccountId,
      debitSYP: 0,
      debitUSD: 0,
      creditSYP: amountSYP,
      creditUSD: amountUSD,
      description: `Payment via ${paymentMethod}`,
      sourceType,
      sourceId,
    },
  ];

  return createJournalEntry(
    tenantId,
    new Date(),
    description,
    reference,
    sourceType,
    sourceId,
    createdById,
    lines
  );
}

/**
 * Create journal entry for payroll payment (cash/bank decrease + payroll expense)
 * @param payrollRecord - The payroll record object
 * @param tenantId - The tenant ID
 * @param createdById - Optional user ID who created the entry
 * @returns The created journal entry
 */
export async function createPayrollJournalEntry(
  payrollRecord: any,
  tenantId: string,
  createdById: string | null = null
): Promise<any> {
  // Get fiscal period for payroll date
  const fiscalPeriod = await getOpenFiscalPeriod(tenantId, payrollRecord.paidAt || new Date());
  if (!fiscalPeriod) {
    throw new Error('No open fiscal period found for the payroll date');
  }

  // Get employee information
  const employee = await prisma.employee.findUnique({
    where: { id: payrollRecord.employeeId },
    include: { department: true },
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  // Get cash account (default to CASH, can be overridden)
  const cashAccountId = await getAccountIdByCode(tenantId, DEFAULT_ACCOUNT_CODES.CASH);
  if (!cashAccountId) {
    throw new Error('Cash account not found');
  }

  // Get payroll expense account
  const payrollExpenseAccountId = await getAccountIdByCode(tenantId, DEFAULT_ACCOUNT_CODES.PAYROLL_EXPENSE);
  if (!payrollExpenseAccountId) {
    throw new Error('Payroll expense account not found');
  }

  // Calculate total net salary
  const netSalarySYP = Number(payrollRecord.netSalarySYP);
  const netSalaryUSD = Number(payrollRecord.netSalaryUSD || 0);

  // Create journal lines
  const lines: JournalLineInput[] = [
    {
      accountId: payrollExpenseAccountId,
      debitSYP: netSalarySYP,
      debitUSD: netSalaryUSD,
      creditSYP: 0,
      creditUSD: 0,
      description: `Payroll for ${employee.fullNameAr} - ${payrollRecord.periodStart} to ${payrollRecord.periodEnd}`,
      sourceType: 'PAYROLL',
      sourceId: payrollRecord.id,
    },
    {
      accountId: cashAccountId,
      debitSYP: 0,
      debitUSD: 0,
      creditSYP: netSalarySYP,
      creditUSD: netSalaryUSD,
      description: `Payroll payment for ${employee.fullNameAr}`,
      sourceType: 'PAYROLL',
      sourceId: payrollRecord.id,
    },
  ];

  const description = `Payroll Payment - ${employee.fullNameAr} (${employee.position}) - ${payrollRecord.periodStart} to ${payrollRecord.periodEnd}`;
  const reference = `PAY-${payrollRecord.id}`;

  return createJournalEntry(
    tenantId,
    payrollRecord.paidAt || new Date(),
    description,
    reference,
    'PAYROLL',
    payrollRecord.id,
    createdById,
    lines
  );
}

/**
 * Reverse a journal entry (for corrections)
 * @param journalEntryId - The journal entry ID to reverse
 * @param reason - The reason for reversal
 * @param tenantId - The tenant ID
 * @param createdById - Optional user ID who created the reversal
 * @returns The reversing journal entry
 */
export async function reverseJournalEntry(
  journalEntryId: string,
  reason: string,
  tenantId: string,
  createdById: string | null = null
): Promise<any> {
  const originalEntry = await prisma.journalEntry.findUnique({
    where: { id: journalEntryId },
    include: { lines: true },
  });

  if (!originalEntry) {
    throw new Error('Original journal entry not found');
  }

  if (originalEntry.isReversed) {
    throw new Error('Journal entry already reversed');
  }

  if (originalEntry.tenantId !== tenantId) {
    throw new Error('Journal entry does not belong to this tenant');
  }

  // Create reversing entry
  const reversingLines: JournalLineInput[] = originalEntry.lines.map((line) => ({
    accountId: line.accountId,
    debitSYP: Number(line.creditSYP),
    debitUSD: Number(line.creditUSD),
    creditSYP: Number(line.debitSYP),
    creditUSD: Number(line.debitUSD),
    description: `Reversal of: ${line.description || originalEntry.description}`,
    sourceType: `REVERSAL_OF_${originalEntry.sourceType || 'JOURNAL'}`,
    sourceId: originalEntry.id,
  }));

  const reversingEntry = await createJournalEntry(
    tenantId,
    new Date(),
    `Reversal of: ${originalEntry.description} - ${reason}`,
    `REV-${originalEntry.reference || originalEntry.id}`,
    `REVERSAL_OF_${originalEntry.sourceType || 'JOURNAL'}`,
    originalEntry.id,
    createdById,
    reversingLines
  );

  // Mark original as reversed
  await prisma.journalEntry.update({
    where: { id: journalEntryId },
    data: {
      isReversed: true,
      reversingDate: new Date(),
    },
  });

  return reversingEntry;
}

/**
 * Export all functions for use in other modules
 */
/**
 * Create monthly depreciation journal entries for all active assets
 * @param tenantId - The tenant ID
 * @param entryDate - The date for the entry (default: last day of month)
 * @param createdById - Optional user ID
 * @returns Summary of created entries
 */
export async function createDepreciationJournalEntries(
  tenantId: string,
  entryDate: Date = new Date(),
  createdById: string | null = null
): Promise<{ created: number; totalAmount: number; entries: string[] }> {
  const assets = await prisma.asset.findMany({
    where: { tenantId, isActive: true },
    include: { category: true },
  });

  if (assets.length === 0) {
    return { created: 0, totalAmount: 0, entries: [] };
  }

  const depreciationExpenseAccountId = await getAccountIdByCode(tenantId, DEFAULT_ACCOUNT_CODES.DEPRECIATION_EXPENSE);
  const accumulatedDepreciationAccountId = await getAccountIdByCode(tenantId, DEFAULT_ACCOUNT_CODES.ACCUMULATED_DEPRECIATION);

  if (!depreciationExpenseAccountId || !accumulatedDepreciationAccountId) {
    throw new Error('Depreciation accounts not found. Please set up chart of accounts.');
  }

  const createdEntries: string[] = [];
  let totalAmount = 0;

  for (const asset of assets) {
    const monthlyDep = Number(asset.userAdjustedDepreciation || asset.monthlyDepreciation || 0);
    if (monthlyDep <= 0) continue;

    const purchaseCost = Number(asset.purchaseCost);
    const currentAccumulated = Number(asset.accumulatedDepreciation || 0);
    const salvageValue = Number(asset.salvageValue || 0);
    const remainingValue = purchaseCost - currentAccumulated;

    // Don't depreciate beyond salvage value
    const depAmount = Math.min(monthlyDep, remainingValue - salvageValue);
    if (depAmount <= 0) continue;

    // Check if already depreciated this month
    const startOfMonth = new Date(entryDate.getFullYear(), entryDate.getMonth(), 1);
    const endOfMonth = new Date(entryDate.getFullYear(), entryDate.getMonth() + 1, 0, 23, 59, 59);

    const existingEntry = await prisma.journalEntry.findFirst({
      where: {
        tenantId,
        sourceType: 'DEPRECIATION',
        sourceId: asset.id,
        entryDate: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    if (existingEntry) continue;

    const lines: JournalLineInput[] = [
      {
        accountId: depreciationExpenseAccountId,
        debitSYP: depAmount,
        debitUSD: 0,
        creditSYP: 0,
        creditUSD: 0,
        description: `إهلاك ${asset.name} - ${asset.category?.name || ''}`,
        sourceType: 'DEPRECIATION',
        sourceId: asset.id,
      },
      {
        accountId: accumulatedDepreciationAccountId,
        debitSYP: 0,
        debitUSD: 0,
        creditSYP: depAmount,
        creditUSD: 0,
        description: `مجمع إهلاك ${asset.name}`,
        sourceType: 'DEPRECIATION',
        sourceId: asset.id,
      },
    ];

    const entry = await createJournalEntry(
      tenantId,
      entryDate,
      `قيد إهلاك شهري - ${asset.name}`,
      `DEP-${asset.id}-${entryDate.toISOString().slice(0, 7)}`,
      'DEPRECIATION',
      asset.id,
      createdById,
      lines
    );

    // Update asset accumulated depreciation
    await prisma.asset.update({
      where: { id: asset.id },
      data: {
        accumulatedDepreciation: { increment: depAmount },
      },
    });

    createdEntries.push(entry.id);
    totalAmount += depAmount;
  }

  return { created: createdEntries.length, totalAmount, entries: createdEntries };
}

export default {
  createJournalEntry,
  createInvoiceJournalEntry,
  createPaymentReceivedJournalEntry,
  createChequeDepositJournalEntry,
  createChequeClearanceJournalEntry,
  createChequeBounceJournalEntry,
  createInstallmentPaymentJournalEntry,
  createExpenseJournalEntry,
  createPayrollJournalEntry,
  createDepreciationJournalEntries,
  reverseJournalEntry,
  getAccountIdByCode,
  getDefaultExchangeRate,
  getOpenFiscalPeriod,
  updateAccountBalance,
};
