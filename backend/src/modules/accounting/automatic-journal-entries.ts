import { AccountType, JournalEntryStatus, Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { ACCOUNT_MAPPING_DEFINITIONS, DEFAULT_ACCOUNTS, DEFAULT_ACCOUNT_CODES, EMPLOYEE_RECEIVABLE_CODE } from './chart-of-accounts.defaults';

export { DEFAULT_ACCOUNT_CODES };

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
  bookingId?: string | null;
  serviceId?: string | null;
  bookingServiceId?: string | null;
  costCenterId?: string | null;
  customerId?: string | null;
  supplierId?: string | null;
  dueDate?: Date | null;
}

/**
 * Auto-create default accounts if missing for a tenant
 */
export async function ensureDefaultAccounts(tenantId: string, client?: Prisma.TransactionClient): Promise<void> {
  if (!client) {
    await prisma.$transaction(
      (tx) => ensureDefaultAccounts(tenantId, tx),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
    return;
  }

  const [existingAccounts, existingMappings] = await Promise.all([
    client.account.findMany({
      where: { tenantId },
      select: { id: true, code: true, nameAr: true, accountType: true, parentId: true, isActive: true, deletedAt: true },
    }),
    client.accountPostingMap.findMany({
      where: { tenantId },
      include: { account: { select: { tenantId: true, isActive: true, accountType: true, deletedAt: true, children: { select: { id: true } } } } },
    }),
  ]);
  const existingMappingCount = existingMappings.length;
  const chartMappingsInitialized = existingMappingCount >= Object.keys(DEFAULT_ACCOUNT_CODES).length;
  const existingAccountsByCode = new Map(existingAccounts.map((account) => [account.code, account]));
  const existingMappingsByRole = new Map(existingMappings.map((mapping) => [mapping.mappingKey, mapping]));
  const accountIds = new Map<string, string>();
  const newlyCreatedCodes = new Set<string>();
  for (const account of DEFAULT_ACCOUNTS) {
    const existing = existingAccountsByCode.get(account.code);
    if (existing) {
      if (
        !existing.isActive ||
        existing.deletedAt ||
        existing.accountType !== account.accountType ||
        (!chartMappingsInitialized && existing.nameAr !== account.nameAr)
      ) {
        throw new Error(
          `Account code ${account.code} conflicts with the approved default chart. ` +
          'Resolve the account mapping before posting.'
        );
      }
      accountIds.set(account.code, existing.id);
      continue;
    }

    const created = await client.account.create({
      data: {
        tenantId,
        code: account.code,
        nameAr: account.nameAr,
        nameEn: account.nameEn,
        accountType: account.accountType,
        category: account.category as any,
        isActive: true,
      },
      select: { id: true },
    });
    accountIds.set(account.code, created.id);
    newlyCreatedCodes.add(account.code);
  }

  for (const account of DEFAULT_ACCOUNTS) {
    if (!account.parentCode || !newlyCreatedCodes.has(account.code)) continue;
    const accountId = accountIds.get(account.code);
    const parentId = accountIds.get(account.parentCode);
    if (!accountId || !parentId) {
      throw new Error(`Invalid default chart hierarchy for account ${account.code}`);
    }
    await client.account.update({
      where: { id: accountId },
      data: { parentId },
    });
  }

  for (const [mappingKey, code] of Object.entries(DEFAULT_ACCOUNT_CODES)) {
    const accountId = accountIds.get(code);
    if (!accountId) {
      throw new Error(`Default account ${code} for ${mappingKey} is missing from the chart`);
    }

    const existingMapping = existingMappingsByRole.get(mappingKey);
    if (existingMapping) {
      const definition = ACCOUNT_MAPPING_DEFINITIONS.find((item) => item.key === mappingKey);
      if (
        existingMapping.account.tenantId !== tenantId ||
        !!existingMapping.account.deletedAt ||
        existingMapping.account.accountType !== definition?.accountType ||
        (existingMapping.isActive && (existingMapping.account.children || []).length > 0)
      ) {
        throw new Error(`Account mapping ${mappingKey} points to an account of the wrong tenant or type`);
      }
      continue;
    }

    await client.accountPostingMap.create({
      data: { tenantId, mappingKey, accountId, isActive: true },
    });
  }
}

/**
 * Get account ID by code for a specific tenant
 * @param tenantId - The tenant ID
 * @param code - The account code
 * @returns The account ID or null if not found
 */
export async function getAccountIdByCode(
  tenantId: string,
  code: string,
  client: Prisma.TransactionClient | typeof prisma = prisma
): Promise<string | null> {
  const account = await client.account.findFirst({
    where: {
      tenantId,
      code,
      isActive: true,
    },
    select: { id: true },
  });

  return account?.id || null;
}

export async function getAccountIdByRole(
  tenantId: string,
  mappingKey: keyof typeof DEFAULT_ACCOUNT_CODES,
  client: Prisma.TransactionClient | typeof prisma = prisma
): Promise<string | null> {
  const definition = ACCOUNT_MAPPING_DEFINITIONS.find((item) => item.key === mappingKey);
  if (!definition) throw new Error(`Unknown accounting mapping role: ${mappingKey}`);

  const mapping = await client.accountPostingMap.findFirst({
    where: { tenantId, mappingKey },
    include: { account: { select: { tenantId: true, isActive: true, accountType: true, deletedAt: true } } },
  });

  if (mapping) {
    if (!mapping.isActive || mapping.account.tenantId !== tenantId || !mapping.account.isActive || mapping.account.deletedAt) return null;
    if (mapping.account.accountType !== definition.accountType) {
      throw new Error(`Account mapping ${mappingKey} points to an account of the wrong type`);
    }
    return mapping.accountId;
  }

  const fallback = await client.account.findFirst({
    where: {
      tenantId,
      code: DEFAULT_ACCOUNT_CODES[mappingKey],
      isActive: true,
      deletedAt: null,
    },
    select: { id: true, accountType: true, children: { select: { id: true } } },
  });
  if (!fallback) return null;
  if (fallback.accountType !== definition.accountType) {
    throw new Error(`Default account for ${mappingKey} has the wrong account type`);
  }
  if ((fallback.children || []).length > 0) {
    throw new Error(`Default account for ${mappingKey} is a parent account and cannot receive postings`);
  }
  return fallback.id;
}

export async function getReceivableAccountIdForInvoice(
  tenantId: string,
  invoice: { employeeId?: string | null },
  db: Prisma.TransactionClient | typeof prisma = prisma
): Promise<string | null> {
  if (!invoice.employeeId) return getAccountIdByRole(tenantId, 'ACCOUNTS_RECEIVABLE', db);
  const account = await db.account.findFirst({
    where: { tenantId, code: EMPLOYEE_RECEIVABLE_CODE, accountType: AccountType.ASSET, isActive: true, deletedAt: null },
    select: { id: true, children: { select: { id: true } } },
  });
  if (!account) return null;
  if ((account.children || []).length > 0) throw new Error('Employee receivable account is a parent account and cannot receive postings');
  return account.id;
}

async function validateMappedAccount(
  tenantId: string,
  accountId: string,
  accountType: AccountType,
  client: Prisma.TransactionClient | typeof prisma
): Promise<string> {
  const account = await client.account.findFirst({
    where: { id: accountId, tenantId, isActive: true, deletedAt: null },
    select: { id: true, accountType: true, children: { select: { id: true } } },
  });
  if (!account || account.accountType !== accountType) {
    throw new Error(`Configured posting account ${accountId} is not an active ${accountType} account for this tenant`);
  }
  if ((account.children || []).length > 0) {
    throw new Error(`Configured posting account ${accountId} is a parent account and cannot receive postings`);
  }
  return account.id;
}

async function getServicePostingInfo(
  tenantId: string,
  serviceId: string,
  client: Prisma.TransactionClient | typeof prisma
): Promise<{ revenueAccountId: string; costCenterId: string | null }> {
  const service = await client.service.findFirst({
    where: { id: serviceId, tenantId, deletedAt: null },
    select: {
      revenueAccountId: true,
      category: { select: { revenueAccountId: true, costCenterId: true, name: true, nameAr: true } },
    },
  });
  if (!service) throw new Error(`Service ${serviceId} is unavailable for invoice posting`);

  let accountId = service.revenueAccountId || service.category?.revenueAccountId || null;
  if (!accountId) {
    const categoryName = service.category?.nameAr || service.category?.name || '';
    const role = categoryName === 'الحماية والعناية والتجديد'
      ? 'PROTECTION_REVENUE'
      : categoryName === 'الغسيل والخدمات السريعة'
        ? 'WASH_REVENUE'
        : 'SERVICE_REVENUE';
    accountId = await getAccountIdByRole(tenantId, role, client);
  }
  if (!accountId) throw new Error(`Revenue account mapping is missing for service ${serviceId}`);

  return {
    revenueAccountId: await validateMappedAccount(tenantId, accountId, AccountType.REVENUE, client),
    costCenterId: service.category?.costCenterId || null,
  };
}

async function getPartPostingAccount(
  tenantId: string,
  partId: string,
  role: 'INVENTORY' | 'COST_OF_GOODS_SOLD' | 'PARTS_REVENUE',
  client: Prisma.TransactionClient | typeof prisma
): Promise<string> {
  const part = await client.part.findFirst({
    where: { id: partId, tenantId, deletedAt: null },
    select: {
      inventoryAccountId: true,
      costAccountId: true,
      revenueAccountId: true,
      category: {
        select: {
          tenantId: true,
          inventoryAccountId: true,
          costAccountId: true,
          revenueAccountId: true,
        },
      },
    },
  });
  if (!part) throw new Error(`Part ${partId} is unavailable for posting`);
  if (part.category && part.category.tenantId !== tenantId) {
    throw new Error(`Part ${partId} has a category belonging to another tenant`);
  }

  const configuredAccountId = role === 'INVENTORY'
    ? part.inventoryAccountId || part.category?.inventoryAccountId
    : role === 'COST_OF_GOODS_SOLD'
      ? part.costAccountId || part.category?.costAccountId
      : part.revenueAccountId || part.category?.revenueAccountId;
  if (configuredAccountId) {
    const type = role === 'INVENTORY'
      ? AccountType.ASSET
      : role === 'PARTS_REVENUE' ? AccountType.REVENUE : AccountType.COGS;
    return validateMappedAccount(tenantId, configuredAccountId, type, client);
  }

  const fallback = await getAccountIdByRole(tenantId, role, client);
  if (!fallback) throw new Error(`Default posting account is not configured for part ${partId}`);
  return fallback;
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
export async function getOpenFiscalPeriod(
  tenantId: string,
  date: Date,
  client: Prisma.TransactionClient | typeof prisma = prisma
): Promise<any | null> {
  return client.fiscalPeriod.findFirst({
    where: {
      tenantId,
      startDate: { lte: date },
      endDate: { gte: date },
      isClosed: false,
    },
  });
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
  lines: JournalLineInput[],
  client?: Prisma.TransactionClient,
  exchangeRateUsed?: number | null
): Promise<any> {
  if (!client) {
    try {
      return await prisma.$transaction((tx) => createJournalEntry(
        tenantId,
        entryDate,
        description,
        reference,
        sourceType,
        sourceId,
        createdById,
        lines,
        tx,
        exchangeRateUsed
      ));
    } catch (error) {
      if ((error as any)?.code === 'P2002' && sourceType && sourceId) {
        const existingEntry = await prisma.journalEntry.findFirst({
          where: { tenantId, sourceType, sourceId, isReversed: false },
        });
        if (existingEntry) return existingEntry;
      }
      throw error;
    }
  }

  // Idempotency check: if a journal entry with the same sourceType and sourceId exists, return it
  if (sourceType && sourceId) {
    const existingEntry = await client.journalEntry.findFirst({
      where: { tenantId, sourceType, sourceId, isReversed: false },
    });
    if (existingEntry) return existingEntry;
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
  const fiscalPeriod = await getOpenFiscalPeriod(tenantId, entryDate, client);
  if (!fiscalPeriod) throw new Error('No open fiscal period found for the entry date');

  let recordedExchangeRate = exchangeRateUsed || null;
  const settingsDelegate = (client as any).companySettings;
  if (!recordedExchangeRate && settingsDelegate?.findUnique) {
    const settings = await settingsDelegate.findUnique({
      where: { tenantId },
      select: { exchangeRate: true },
    });
    const configuredRate = Number(settings?.exchangeRate || 0);
    if (configuredRate > 0) recordedExchangeRate = configuredRate;
  }

  // Create journal entry
  const journalEntry = await client.journalEntry.create({
    data: {
      tenantId,
      entryDate,
      description,
      exchangeRateUsed: recordedExchangeRate || undefined,
      reference: reference || undefined,
      fiscalPeriodId: fiscalPeriod.id,
      sourceType: sourceType || undefined,
      sourceId: sourceId || undefined,
      createdById: createdById || undefined,
      status: JournalEntryStatus.POSTED,
    },
  });

  // Create journal lines
  await client.journalLine.createMany({
    data: lines.map((line) => ({
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
      bookingId: line.bookingId || undefined,
      serviceId: line.serviceId || undefined,
      bookingServiceId: line.bookingServiceId || undefined,
      costCenterId: line.costCenterId || undefined,
      customerId: line.customerId || undefined,
      supplierId: line.supplierId || undefined,
      dueDate: line.dueDate || undefined,
    })),
  });

  // Update account balances
  for (const line of lines) {
    await updateAccountBalance(line.accountId, line.debitSYP, line.creditSYP, line.debitUSD, line.creditUSD, client);
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
  creditUSD: number,
  client?: Prisma.TransactionClient
): Promise<void> {
  if (!client) {
    return prisma.$transaction((tx) => updateAccountBalance(accountId, debitSYP, creditSYP, debitUSD, creditUSD, tx));
  }

  const account = await client.account.findUnique({
    where: { id: accountId },
    select: { accountType: true },
  });
  if (!account) throw new Error('Account not found');

  // Update balance based on account type
  // For assets, COGS and expenses: debit increases balance, credit decreases
  // For liabilities, equity, revenue: credit increases balance, debit decreases
  const debitIncreases = account.accountType === AccountType.ASSET ||
    account.accountType === AccountType.COGS || account.accountType === AccountType.EXPENSE;
  const deltaSYP = debitIncreases ? debitSYP - creditSYP : creditSYP - debitSYP;
  const deltaUSD = debitIncreases ? debitUSD - creditUSD : creditUSD - debitUSD;

  await client.account.update({
    where: { id: accountId },
    data: {
      balanceSYP: { increment: deltaSYP },
      balanceUSD: { increment: deltaUSD },
    },
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
  createdById: string | null = null,
  client?: Prisma.TransactionClient
): Promise<any> {
  // Get fiscal period for invoice date
  const fiscalPeriod = await getOpenFiscalPeriod(tenantId, invoice.invoiceDate, client || prisma);
  if (!fiscalPeriod) {
    throw new Error('No open fiscal period found for invoice date');
  }

  // Get account codes
  const db = client || prisma;
  const arAccountId = await getReceivableAccountIdForInvoice(tenantId, invoice, db);
  const fallbackServiceRevenueAccountId = await getAccountIdByRole(tenantId, 'INSPECTION_REVENUE', db);
  const discountRevenueAccountId = await getAccountIdByRole(tenantId, 'DISCOUNT_REVENUE', db);
  const vatPayableAccountId = await getAccountIdByRole(tenantId, 'VAT_PAYABLE', db);

  if (!arAccountId) {
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
      bookingId: invoice.bookingId || null,
      customerId: invoice.customerId || null,
      dueDate: invoice.dueDate || null,
    },
  ];

  // Add revenue lines based on invoice items
  if (invoice.items && Array.isArray(invoice.items)) {
    for (const item of invoice.items) {
      let revenueAccountId: string | null = null;
      let serviceCostCenterId: string | null = null;
      if (item.partId) {
        revenueAccountId = await getPartPostingAccount(tenantId, item.partId, 'PARTS_REVENUE', db);
        if (item.serviceId) {
          serviceCostCenterId = (await getServicePostingInfo(tenantId, item.serviceId, db)).costCenterId;
        }
      } else if (item.serviceId) {
        const servicePosting = await getServicePostingInfo(tenantId, item.serviceId, db);
        revenueAccountId = servicePosting.revenueAccountId;
        serviceCostCenterId = servicePosting.costCenterId;
      } else {
        revenueAccountId = fallbackServiceRevenueAccountId;
      }
      if (revenueAccountId) {
        revenueAccountId = await validateMappedAccount(tenantId, revenueAccountId, AccountType.REVENUE, db);
      }
      if (!revenueAccountId) {
        throw new Error(`No revenue account is configured for invoice item "${item.description}"`);
      }
      const quantity = Number(item.quantity);
      const totalSYP = Number(item.priceSYP) * quantity;
      const totalUSD = Number(item.priceUSD || 0) * quantity;

      lines.push({
        accountId: revenueAccountId,
        debitSYP: 0,
        debitUSD: 0,
        creditSYP: totalSYP,
        creditUSD: totalUSD,
        description: item.description || item.itemName,
        sourceType: 'INVOICE',
        sourceId: invoice.id,
        bookingId: invoice.bookingId || null,
        serviceId: item.serviceId || null,
        bookingServiceId: item.bookingServiceId || null,
        costCenterId: serviceCostCenterId,
      });
    }
  }

  // Add tax/VAT payable if any
  if (Number(invoice.taxSYP) > 0 && !vatPayableAccountId) {
    throw new Error('Tax is present but the tax payable account is not configured');
  }
  if (Number(invoice.taxSYP) > 0) {
    if (!vatPayableAccountId) throw new Error('Tax payable account is not configured');
    lines.push({
      accountId: vatPayableAccountId,
      debitSYP: 0,
      debitUSD: 0,
      creditSYP: Number(invoice.taxSYP),
      creditUSD: Number(invoice.taxUSD || 0),
      description: `VAT/Tax on Invoice ${invoice.invoiceNumber}`,
      sourceType: 'INVOICE',
      sourceId: invoice.id,
      bookingId: invoice.bookingId || null,
    });
  }

  // Add discount if any (debit contra-revenue to reduce net revenue)
  if (Number(invoice.discountSYP) > 0) {
    if (!discountRevenueAccountId) {
      throw new Error('Invoice discount account is not configured');
    }
    lines.push({
      accountId: discountRevenueAccountId,
      debitSYP: Number(invoice.discountSYP),
      debitUSD: Number(invoice.discountUSD || 0),
      creditSYP: 0,
      creditUSD: 0,
      description: 'Sales Discount',
      sourceType: 'INVOICE',
      sourceId: invoice.id,
      bookingId: invoice.bookingId || null,
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
    lines,
    client
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
  createdById: string | null = null,
  client?: Prisma.TransactionClient,
  journalSourceType = 'PAYMENT',
  journalSourceId = payment.id
): Promise<any> {
  // Get fiscal period for payment date
  const db = client || prisma;
  const fiscalPeriod = await getOpenFiscalPeriod(tenantId, payment.paymentDate, db);
  if (!fiscalPeriod) {
    throw new Error('No open fiscal period found for payment date');
  }

  // Get account codes based on payment method
  const cashAccountId = await getAccountIdByRole(tenantId, 'CASH', db);
  const bankAccountId = await getAccountIdByRole(tenantId, 'BANK', db);
  const chequeAccountId = await getAccountIdByRole(tenantId, 'CHEQUES_RECEIVABLE', db);
  const paymentInvoice = payment.invoice ?? (payment.invoiceId
    ? await db.invoice.findUnique({ where: { id: payment.invoiceId }, select: { employeeId: true } })
    : null);
  const arAccountId = await getReceivableAccountIdForInvoice(tenantId, { employeeId: paymentInvoice?.employeeId ?? null }, db);
  const discountExpenseAccountId = await getAccountIdByRole(tenantId, 'DISCOUNT_EXPENSE', db);

  if (!cashAccountId || !bankAccountId || !chequeAccountId || !arAccountId) {
    throw new Error('Required accounts not found. Please set up chart of accounts.');
  }

  const debitAccountId = payment.paymentMethod === 'CASH'
    ? cashAccountId
    : payment.paymentMethod === 'CHECK' ? chequeAccountId : bankAccountId;
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
      sourceType: journalSourceType,
      sourceId: journalSourceId,
      customerId: payment.customerId || payment.invoice?.customerId || null,
    },
    {
      accountId: arAccountId,
      debitSYP: 0,
      debitUSD: 0,
      creditSYP: arCreditSYP,
      creditUSD: arCreditUSD,
      description: `Payment for invoice ${payment.invoiceNumber || payment.reference}`,
      sourceType: journalSourceType,
      sourceId: journalSourceId,
      customerId: payment.customerId || payment.invoice?.customerId || null,
    },
  ];

  // Add discount if any (debit discount expense, AR already includes it)
  if (discountSYP > 0 || discountUSD > 0) {
    lines.push({
      accountId: discountExpenseAccountId!,
      debitSYP: discountSYP,
      debitUSD: discountUSD,
      creditSYP: 0,
      creditUSD: 0,
      description: 'Early payment discount',
      sourceType: journalSourceType,
      sourceId: journalSourceId,
      customerId: payment.customerId || payment.invoice?.customerId || null,
    });
  }

  return createJournalEntry(
    tenantId,
    payment.paymentDate,
    `Payment received - ${payment.paymentNumber || payment.reference}`,
    payment.paymentNumber || payment.reference,
    journalSourceType,
    journalSourceId,
    createdById,
    lines,
    client
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
  createdById: string | null = null,
  client?: Prisma.TransactionClient
): Promise<any> {
  // Get fiscal period for GRN date
  const db = client || prisma;
  const fiscalPeriod = await getOpenFiscalPeriod(tenantId, grn.receivedDate, db);
  if (!fiscalPeriod) throw new Error('No open fiscal period found for GRN date');

  const accountsPayableAccountId = await getAccountIdByRole(tenantId, 'ACCOUNTS_PAYABLE', db);
  if (!accountsPayableAccountId) throw new Error('Supplier payable account is not configured');

  const inventoryByAccount = new Map<string, { amountSYP: number; amountUSD: number }>();
  const damagedByAccount = new Map<string, { amountSYP: number; amountUSD: number }>();
  let payableSYP = 0;
  let payableUSD = 0;
  for (const line of grn.lines || []) {
    const partId = line.partId || line.part?.id;
    if (!partId) throw new Error('A GRN line is missing its inventory item');
    const unitCostSYP = Number(line.unitCost);
    const unitCostUSD = Number(line.unitCostUSD || 0);
    const damagedQuantity = Number(line.damagedQuantity || 0);
    const netQuantity = Math.max(0, Number(line.receivedQuantity) - damagedQuantity);
    if (netQuantity > 0) {
      const accountId = await getPartPostingAccount(tenantId, partId, 'INVENTORY', db);
      const current = inventoryByAccount.get(accountId) || { amountSYP: 0, amountUSD: 0 };
      current.amountSYP += netQuantity * unitCostSYP;
      current.amountUSD += netQuantity * unitCostUSD;
      inventoryByAccount.set(accountId, current);
    }
    if (damagedQuantity > 0) {
      const accountId = await getPartPostingAccount(tenantId, partId, 'COST_OF_GOODS_SOLD', db);
      const current = damagedByAccount.get(accountId) || { amountSYP: 0, amountUSD: 0 };
      current.amountSYP += damagedQuantity * unitCostSYP;
      current.amountUSD += damagedQuantity * unitCostUSD;
      damagedByAccount.set(accountId, current);
    }
    payableSYP += Number(line.receivedQuantity) * unitCostSYP;
    payableUSD += Number(line.receivedQuantity) * unitCostUSD;
  }

  const lines: JournalLineInput[] = [];
  for (const [accountId, amounts] of inventoryByAccount) {
    lines.push({
      accountId,
      debitSYP: amounts.amountSYP,
      debitUSD: amounts.amountUSD,
      creditSYP: 0,
      creditUSD: 0,
      description: `Inventory received via GRN ${grn.grnNumber}`,
      sourceType: 'GRN',
      sourceId: grn.id,
    });
  }
  for (const [accountId, amounts] of damagedByAccount) {
    lines.push({
      accountId,
      debitSYP: amounts.amountSYP,
      debitUSD: amounts.amountUSD,
      creditSYP: 0,
      creditUSD: 0,
      description: `Damaged items from GRN ${grn.grnNumber}`,
      sourceType: 'GRN',
      sourceId: grn.id,
    });
  }
  lines.push({
    accountId: accountsPayableAccountId,
    debitSYP: 0,
    debitUSD: 0,
    creditSYP: payableSYP,
    creditUSD: payableUSD,
    description: `Supplier payable for GRN ${grn.grnNumber}`,
    sourceType: 'GRN',
    sourceId: grn.id,
    supplierId: grn.supplierId || null,
    dueDate: grn.dueDate || null,
  });

  return createJournalEntry(
    tenantId,
    grn.receivedDate,
    `GRN ${grn.grnNumber} - ${grn.supplier?.name || 'Supplier'}`,
    grn.grnNumber,
    'GRN',
    grn.id,
    createdById,
    lines,
    client
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
  createdById: string | null = null,
  client?: Prisma.TransactionClient
): Promise<any> {
  // Get fiscal period for transaction date
  const db = client || prisma;
  const fiscalPeriod = await getOpenFiscalPeriod(tenantId, transaction.createdAt, db);
  if (!fiscalPeriod) {
    throw new Error('No open fiscal period found for transaction date');
  }

  // Get account codes
  const inventoryAccountId = await getPartPostingAccount(tenantId, transaction.partId, 'INVENTORY', db);
  const costOfGoodsSoldAccountId = await getPartPostingAccount(tenantId, transaction.partId, 'COST_OF_GOODS_SOLD', db);

  const quantity = Number(transaction.quantity);
  const totalCostSYP = Number(transaction.costSYP) * quantity;
  const totalCostUSD = Number(transaction.costUSD || 0) * quantity;
  const partName = transaction.part?.nameAr || transaction.part?.name || 'مادة';
  const customerName = transaction.booking?.customer?.fullName;
  const vehicle = transaction.booking?.vehicle;
  const vehicleText = vehicle
    ? [vehicle.make, vehicle.model, vehicle.licensePlate ? `(${vehicle.licensePlate})` : ''].filter(Boolean).join(' ')
    : '';
  const serviceName = transaction.bookingService?.service?.nameAr
    || transaction.bookingService?.service?.name
    || transaction.service?.nameAr
    || transaction.service?.name
    || 'خدمة الورشة';
  const workContext = [
    customerName ? `العميل ${customerName}` : '',
    vehicleText ? `السيارة ${vehicleText}` : '',
    serviceName,
  ].filter(Boolean).join(' · ');
  const contextDescription = customerName || vehicleText
    ? workContext
    : /[\u0600-\u06ff]/.test(String(transaction.notes || ''))
      ? transaction.notes
      : workContext;

  const lines: JournalLineInput[] = [
    {
      accountId: costOfGoodsSoldAccountId,
      debitSYP: totalCostSYP,
      debitUSD: totalCostUSD,
      creditSYP: 0,
      creditUSD: 0,
      description: `تكلفة مادة مستهلكة: ${partName} · ${contextDescription}`,
      sourceType: 'INVENTORY_TRANSACTION',
      sourceId: transaction.id,
      bookingId: transaction.bookingId || null,
      serviceId: transaction.serviceId || null,
      bookingServiceId: transaction.bookingServiceId || null,
      costCenterId: transaction.costCenterId || null,
    },
    {
      accountId: inventoryAccountId,
      debitSYP: 0,
      debitUSD: 0,
      creditSYP: totalCostSYP,
      creditUSD: totalCostUSD,
      description: `تخفيض مخزون المادة: ${partName} · ${contextDescription}`,
      sourceType: 'INVENTORY_TRANSACTION',
      sourceId: transaction.id,
      bookingId: transaction.bookingId || null,
      serviceId: transaction.serviceId || null,
      bookingServiceId: transaction.bookingServiceId || null,
      costCenterId: transaction.costCenterId || null,
    },
  ];

  return createJournalEntry(
    tenantId,
    transaction.createdAt,
    `استهلاك مادة من المخزون: ${partName} · ${contextDescription}`,
    null,
    'INVENTORY_TRANSACTION',
    transaction.id,
    createdById,
    lines,
    client
  );
}

export type StockIntakeSettlementAccount = 'CASH' | 'BANK' | 'PAYABLE';

export async function createStockIntakeJournalEntry(
  transaction: any,
  tenantId: string,
  settlementAccount: StockIntakeSettlementAccount,
  createdById: string | null = null,
  client?: Prisma.TransactionClient
): Promise<any> {
  const db = client || prisma;
  const inventoryAccountId = await getPartPostingAccount(tenantId, transaction.partId, 'INVENTORY', db);
  const offsetRole = settlementAccount === 'CASH'
    ? 'CASH'
    : settlementAccount === 'BANK' ? 'BANK' : 'ACCOUNTS_PAYABLE';
  const offsetAccountId = await getAccountIdByRole(tenantId, offsetRole, db);
  if (!inventoryAccountId || !offsetAccountId) throw new Error('Required stock intake accounts are not configured');

  const quantity = Number(transaction.quantity);
  const totalSYP = Number(transaction.costSYP) * quantity;
  const totalUSD = Number(transaction.costUSD || 0) * quantity;
  const partName = transaction.part?.nameAr || transaction.part?.name || 'مادة';
  const settlementLabel = settlementAccount === 'CASH'
    ? 'الصندوق'
    : settlementAccount === 'BANK' ? 'البنك' : 'ذمم الموردين';
  const lines: JournalLineInput[] = [
    { accountId: inventoryAccountId, debitSYP: totalSYP, debitUSD: totalUSD, creditSYP: 0, creditUSD: 0, description: `استلام مادة إلى المخزون: ${partName}`, sourceType: 'INVENTORY_TRANSACTION', sourceId: transaction.id },
    {
      accountId: offsetAccountId,
      debitSYP: 0,
      debitUSD: 0,
      creditSYP: totalSYP,
      creditUSD: totalUSD,
      description: `مقابل استلام المادة من ${settlementLabel}`,
      sourceType: 'INVENTORY_TRANSACTION',
      sourceId: transaction.id,
      supplierId: settlementAccount === 'PAYABLE' ? transaction.supplierId || null : null,
    },
  ];

  return createJournalEntry(
    tenantId,
    transaction.createdAt,
    `استلام مادة إلى المخزون: ${partName}`,
    null,
    'INVENTORY_TRANSACTION',
    transaction.id,
    createdById,
    lines,
    client
  );
}

/**
 * Revalue existing on-hand stock to the latest intake unit cost.
 * Posts the difference against the inventory-adjustment account so the
 * ledger inventory balance always equals quantity × last purchase price.
 */
export async function createStockRevaluationJournalEntry(
  transaction: any,
  tenantId: string,
  previousQuantity: number,
  previousUnitCostSYP: number,
  previousUnitCostUSD: number,
  newUnitCostSYP: number,
  newUnitCostUSD: number,
  createdById: string | null = null,
  client?: Prisma.TransactionClient
): Promise<any> {
  const db = client || prisma;
  if (previousQuantity <= 0) return null;
  const diffSYP = Math.round((newUnitCostSYP - previousUnitCostSYP) * previousQuantity * 100) / 100;
  const diffUSD = Math.round((newUnitCostUSD - previousUnitCostUSD) * previousQuantity * 100) / 100;
  if (Math.abs(diffSYP) < 0.5 && Math.abs(diffUSD) < 0.01) return null;

  const inventoryAccountId = await getPartPostingAccount(tenantId, transaction.partId, 'INVENTORY', db);
  const adjustmentAccountId = await getAccountIdByRole(tenantId, 'INVENTORY_ADJUSTMENT_GAIN', db);
  if (!adjustmentAccountId) throw new Error('Inventory adjustment account is not configured');

  const partName = transaction.part?.nameAr || transaction.part?.name || 'مادة';
  const lines: JournalLineInput[] = [
    {
      accountId: inventoryAccountId,
      debitSYP: Math.max(diffSYP, 0),
      debitUSD: Math.max(diffUSD, 0),
      creditSYP: Math.max(-diffSYP, 0),
      creditUSD: Math.max(-diffUSD, 0),
      description: `إعادة تقييم المخزون بسعر آخر شراء: ${partName}`,
      sourceType: 'INVENTORY_REVALUATION',
      sourceId: transaction.id,
    },
    {
      accountId: adjustmentAccountId,
      debitSYP: Math.max(-diffSYP, 0),
      debitUSD: Math.max(-diffUSD, 0),
      creditSYP: Math.max(diffSYP, 0),
      creditUSD: Math.max(diffUSD, 0),
      description: `فرق إعادة تقييم المخزون: ${partName}`,
      sourceType: 'INVENTORY_REVALUATION',
      sourceId: transaction.id,
    },
  ];

  return createJournalEntry(
    tenantId,
    transaction.createdAt,
    `إعادة تقييم مخزون بسعر آخر شراء: ${partName}`,
    null,
    'INVENTORY_REVALUATION',
    transaction.id,
    createdById,
    lines,
    client
  );
}

export async function createDealerWarrantyReceiptJournalEntry(
  receipt: any,
  tenantId: string,
  userId: string | null = null,
  client?: Prisma.TransactionClient
): Promise<any> {
  const db = client || prisma;
  const settlementRole = receipt.paymentMethod === 'CASH'
    ? 'CASH'
    : receipt.paymentMethod === 'CHECK' ? 'CHEQUES_RECEIVABLE' : 'BANK';
  const settlementAccountId = await getAccountIdByRole(tenantId, settlementRole, db);
  const warrantyRevenueAccountId = await getAccountIdByRole(tenantId, 'WARRANTY_REVENUE', db);
  if (!settlementAccountId || !warrantyRevenueAccountId) throw new Error('Required dealer warranty receipt accounts are not configured');

  const amountSYP = Number(receipt.amountSYP);
  const amountUSD = Number(receipt.amountUSD);
  const lines: JournalLineInput[] = [
    { accountId: settlementAccountId, debitSYP: amountSYP, debitUSD: amountUSD, creditSYP: 0, creditUSD: 0, description: `Dealer warranty receipt ${receipt.dealerWarrantyId}`, sourceType: 'DEALER_WARRANTY_RECEIPT', sourceId: receipt.id },
    { accountId: warrantyRevenueAccountId, debitSYP: 0, debitUSD: 0, creditSYP: amountSYP, creditUSD: amountUSD, description: 'Dealer warranty revenue received', sourceType: 'DEALER_WARRANTY_RECEIPT', sourceId: receipt.id },
  ];

  return createJournalEntry(
    tenantId,
    receipt.paymentDate,
    `Dealer warranty receipt - ${receipt.dealerWarrantyId}`,
    receipt.reference || null,
    'DEALER_WARRANTY_RECEIPT',
    receipt.id,
    userId,
    lines,
    client
  );
}

export async function createInventoryAdjustmentJournalEntry(
  transaction: any,
  tenantId: string,
  direction: 'IN' | 'OUT',
  createdById: string | null = null,
  client?: Prisma.TransactionClient
): Promise<any> {
  const db = client || prisma;
  const inventoryAccountId = await getPartPostingAccount(tenantId, transaction.partId, 'INVENTORY', db);
  const adjustmentRole = direction === 'IN' ? 'INVENTORY_ADJUSTMENT_GAIN' : 'INVENTORY_DAMAGE_EXPENSE';
  const adjustmentAccountId = await getAccountIdByRole(tenantId, adjustmentRole, db);
  if (!adjustmentAccountId) throw new Error('Inventory adjustment account is not configured');

  const quantity = Number(transaction.quantity);
  const totalSYP = Number(transaction.costSYP) * quantity;
  const totalUSD = Number(transaction.costUSD || 0) * quantity;
  const partName = transaction.part?.nameAr || transaction.part?.name || 'مادة';
  const lines: JournalLineInput[] = direction === 'IN'
    ? [
        { accountId: inventoryAccountId, debitSYP: totalSYP, debitUSD: totalUSD, creditSYP: 0, creditUSD: 0, description: `زيادة رصيد المادة بالتسوية: ${partName}`, sourceType: 'INVENTORY_TRANSACTION', sourceId: transaction.id },
        { accountId: adjustmentAccountId, debitSYP: 0, debitUSD: 0, creditSYP: totalSYP, creditUSD: totalUSD, description: `مكسب تسوية زيادة المخزون: ${partName}`, sourceType: 'INVENTORY_TRANSACTION', sourceId: transaction.id },
      ]
    : [
        { accountId: adjustmentAccountId, debitSYP: totalSYP, debitUSD: totalUSD, creditSYP: 0, creditUSD: 0, description: `عجز أو تلف مادة من المخزون: ${partName}`, sourceType: 'INVENTORY_TRANSACTION', sourceId: transaction.id },
        { accountId: inventoryAccountId, debitSYP: 0, debitUSD: 0, creditSYP: totalSYP, creditUSD: totalUSD, description: `تخفيض رصيد المادة بالتسوية: ${partName}`, sourceType: 'INVENTORY_TRANSACTION', sourceId: transaction.id },
      ];

  return createJournalEntry(
    tenantId,
    transaction.createdAt,
    `تسوية مخزون المادة: ${partName}`,
    null,
    'INVENTORY_TRANSACTION',
    transaction.id,
    createdById,
    lines,
    client
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
  const chequesReceivableAccountId = await getAccountIdByRole(tenantId, 'CHEQUES_RECEIVABLE');
  const arAccountId = await getAccountIdByRole(tenantId, 'ACCOUNTS_RECEIVABLE');

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
  const bankAccountId = await getAccountIdByRole(tenantId, 'BANK');
  const chequesReceivableAccountId = await getAccountIdByRole(tenantId, 'CHEQUES_RECEIVABLE');
  const bankChargesAccountId = await getAccountIdByRole(tenantId, 'BANK_CHARGES_EXPENSE');

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
  const arAccountId = await getAccountIdByRole(tenantId, 'ACCOUNTS_RECEIVABLE');
  const chequesReceivableAccountId = await getAccountIdByRole(tenantId, 'CHEQUES_RECEIVABLE');
  const bankChargesAccountId = await getAccountIdByRole(tenantId, 'BANK_CHARGES_EXPENSE');

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
  const cashAccountId = await getAccountIdByRole(tenantId, 'CASH');
  const bankAccountId = await getAccountIdByRole(tenantId, 'BANK');
  const installmentsPayableAccountId = await getAccountIdByRole(tenantId, 'INSTALLMENTS_PAYABLE');

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
  const cashAccountId = await getAccountIdByRole(tenantId, 'CASH');
  const bankAccountId = await getAccountIdByRole(tenantId, 'BANK');
  const expenseAccountId = await getAccountIdByRole(tenantId, expenseType);

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
  const cashAccountId = await getAccountIdByRole(tenantId, 'CASH');
  if (!cashAccountId) {
    throw new Error('Cash account not found');
  }

  // Get payroll expense account
  const payrollExpenseAccountId = await getAccountIdByRole(tenantId, 'PAYROLL_EXPENSE');
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
  createdById: string | null = null,
  client?: Prisma.TransactionClient
): Promise<any> {
  if (!client) {
    try {
      return await prisma.$transaction((tx) => reverseJournalEntry(journalEntryId, reason, tenantId, createdById, tx));
    } catch (error) {
      if ((error as any)?.code === 'P2002') {
        const originalEntry = await prisma.journalEntry.findUnique({
          where: { id: journalEntryId },
          select: { sourceType: true },
        });
        const reversal = await prisma.journalEntry.findFirst({
          where: {
            tenantId,
            sourceType: `REVERSAL_OF_${originalEntry?.sourceType || 'JOURNAL'}`,
            sourceId: journalEntryId,
            isReversed: false,
          },
        });
        if (reversal) return reversal;
      }
      throw error;
    }
  }

  const originalEntry = await client.journalEntry.findUnique({
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
    bookingId: line.bookingId,
    serviceId: line.serviceId,
    bookingServiceId: line.bookingServiceId,
    costCenterId: line.costCenterId,
    customerId: line.customerId,
    supplierId: line.supplierId,
    dueDate: line.dueDate,
  }));

  const reversingEntry = await createJournalEntry(
    tenantId,
    new Date(),
    `Reversal of: ${originalEntry.description} - ${reason}`,
    `REV-${originalEntry.reference || originalEntry.id}`,
    `REVERSAL_OF_${originalEntry.sourceType || 'JOURNAL'}`,
    originalEntry.id,
    createdById,
    reversingLines,
    client,
    originalEntry.exchangeRateUsed == null ? undefined : Number(originalEntry.exchangeRateUsed)
  );

  // Mark original as reversed
  await client.journalEntry.update({
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

  const depreciationExpenseAccountId = await getAccountIdByRole(tenantId, 'DEPRECIATION_EXPENSE');
  const accumulatedDepreciationAccountId = await getAccountIdByRole(tenantId, 'ACCUMULATED_DEPRECIATION');

  if (!depreciationExpenseAccountId || !accumulatedDepreciationAccountId) {
    throw new Error('Depreciation accounts not found. Please set up chart of accounts.');
  }

  const createdEntries: string[] = [];
  let totalAmount = 0;

  for (const asset of assets) {
    const monthlyDep = Number(asset.userAdjustedDepreciation ?? asset.monthlyDepreciation ?? 0);
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
  ensureDefaultAccounts,
  reverseJournalEntry,
  getAccountIdByCode,
  getAccountIdByRole,
  getDefaultExchangeRate,
  getOpenFiscalPeriod,
  updateAccountBalance,
};
