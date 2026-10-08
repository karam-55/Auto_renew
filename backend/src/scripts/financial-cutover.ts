import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import {
  createJournalEntry,
  DEFAULT_ACCOUNT_CODES,
  getOpenFiscalPeriod,
} from '../modules/accounting/automatic-journal-entries';
import settingsService from '../services/settings.service';
import { Logger } from '../infrastructure/logging/logger';

/**
 * Financial cutover script — run ONCE on production after `prisma migrate deploy`.
 *
 * What it does (all inside DB transactions, all idempotent):
 *   1. Ensures account 3900 "Opening Balance Equity / أرصدة افتتاحية" exists (EQUITY).
 *   2. Posts an opening journal entry for inventory:
 *        Dr 1140 Inventory   /  Cr 3900 Opening Balance Equity
 *      Amounts are READ FROM THE DATABASE: sum(quantity * costUSD) and the
 *      configured exchange rate for the SYP leg. Parts with no cost are
 *      counted but contribute zero value (they stay unvalued on purpose).
 *   3. Clears legacy balances on accounts 1000 and 1300 by posting offsetting
 *      journal lines that bring each balance to exactly zero.
 *      The legacy pair must net to zero together, otherwise the script aborts
 *      rather than post an unbalanced or speculative reclassification.
 *
 * Idempotency: every entry uses sourceType 'OPENING_BALANCE' with a fixed
 * sourceId; createJournalEntry returns the existing entry on re-run.
 *
 * Usage (inside backend container):
 *   node dist/scripts/financial-cutover.js
 * Or locally:
 *   npx ts-node src/scripts/financial-cutover.ts
 * Dry run (reads and prints, writes nothing):
 *   node dist/scripts/financial-cutover.js --dry-run
 */

const TENANT_ID = process.env.DEFAULT_TENANT_ID || 'default';
const SOURCE_TYPE = 'OPENING_BALANCE';
const LEGACY_ACCOUNTS = ['1000', '1300'];
const OPENING_EQUITY_CODE = DEFAULT_ACCOUNT_CODES.OPENING_BALANCE_EQUITY; // '3900'
const EQUITY_PARENT_CODE = '3000';

interface AccountRow {
  id: string;
  code: string;
  nameAr: string;
  balanceSYP: Prisma.Decimal;
  balanceUSD: Prisma.Decimal;
}

async function getAccountByCode(code: string): Promise<AccountRow | null> {
  return prisma.account.findFirst({
    where: { tenantId: TENANT_ID, code, deletedAt: null },
    select: { id: true, code: true, nameAr: true, balanceSYP: true, balanceUSD: true },
  });
}

async function ensureOpeningEquityAccount(tx: Prisma.TransactionClient): Promise<string> {
  const existing = await tx.account.findFirst({
    where: { tenantId: TENANT_ID, code: OPENING_EQUITY_CODE, deletedAt: null },
    select: { id: true },
  });
  if (existing) return existing.id;

  const parent = await tx.account.findFirst({
    where: { tenantId: TENANT_ID, code: EQUITY_PARENT_CODE, deletedAt: null },
    select: { id: true },
  });

  const created = await tx.account.create({
    data: {
      tenantId: TENANT_ID,
      code: OPENING_EQUITY_CODE,
      nameAr: 'أرصدة افتتاحية',
      nameEn: 'Opening Balance Equity',
      accountType: 'EQUITY',
      parentId: parent?.id ?? null,
      isActive: true,
    },
  });
  Logger.info(`Created opening balance equity account ${OPENING_EQUITY_CODE}`);
  return created.id;
}

async function run(dryRun: boolean): Promise<void> {
  const fiscalPeriod = await getOpenFiscalPeriod(TENANT_ID, new Date());
  if (!fiscalPeriod) {
    throw new Error('No open fiscal period covers today — cannot post opening entries.');
  }
  Logger.info(`Fiscal period: ${fiscalPeriod.name} (${fiscalPeriod.id})`);

  // --- 1. Inventory valuation read from the DB ---
  const parts = await prisma.part.findMany({
    where: { tenantId: TENANT_ID, deletedAt: null, isActive: true, quantity: { gt: 0 } },
    select: { id: true, name: true, quantity: true, costUSD: true, costSYP: true },
  });
  let inventoryUSD = 0;
  let inventorySYP = 0;
  let unvaluedUnits = 0;
  const unvaluedParts: string[] = [];
  for (const p of parts) {
    const usd = Number(p.costUSD ?? 0);
    const syp = Number(p.costSYP ?? 0);
    if (usd <= 0 && syp <= 0) {
      unvaluedUnits += p.quantity;
      unvaluedParts.push(`${p.name} x${p.quantity}`);
      continue;
    }
    inventoryUSD += p.quantity * usd;
    inventorySYP += p.quantity * syp;
  }
  Logger.info(`Priced inventory value: $${inventoryUSD.toFixed(2)} / ${inventorySYP.toFixed(2)} SYP`);
  if (unvaluedUnits > 0) {
    Logger.warn(`${unvaluedUnits} units with no cost remain unvalued: ${unvaluedParts.join(', ')}`);
  }

  // SYP leg: if stored SYP costs are zero, derive from USD at the configured rate.
  const rate = await settingsService.getRequiredExchangeRate(TENANT_ID);
  Logger.info(`Configured exchange rate: ${rate}`);
  const inventorySYPForEntry = inventorySYP > 0 ? inventorySYP : Math.round(inventoryUSD * rate * 100) / 100;

  // --- 2. Legacy balances ---
  const legacyRows: AccountRow[] = [];
  for (const code of LEGACY_ACCOUNTS) {
    const acc = await getAccountByCode(code);
    if (!acc) {
      Logger.warn(`Legacy account ${code} not found — skipping it`);
      continue;
    }
    legacyRows.push(acc);
    Logger.info(`Legacy ${code} ${acc.nameAr}: SYP ${acc.balanceSYP} / USD ${acc.balanceUSD}`);
  }
  const legacyNetSYP = legacyRows.reduce((s, a) => s + Number(a.balanceSYP), 0);
  const legacyNetUSD = legacyRows.reduce((s, a) => s + Number(a.balanceUSD), 0);
  const legacyNeedsClearing = legacyRows.some(
    (a) => Math.abs(Number(a.balanceSYP)) > 0.005 || Math.abs(Number(a.balanceUSD)) > 0.005
  );
  if (legacyNeedsClearing && (Math.abs(legacyNetSYP) > 0.005 || Math.abs(legacyNetUSD) > 0.005)) {
    throw new Error(
      `Legacy accounts ${LEGACY_ACCOUNTS.join('/')} do not net to zero ` +
      `(SYP ${legacyNetSYP}, USD ${legacyNetUSD}). Refusing to post an unbalanced clearing entry — ` +
      `review these balances manually before re-running.`
    );
  }

  // --- 3. Print the plan ---
  Logger.info('--- Cutover plan ---');
  Logger.info(`Entry A (inventory): Dr 1140 / Cr ${OPENING_EQUITY_CODE}  =  $${inventoryUSD.toFixed(2)} / ${inventorySYPForEntry.toFixed(2)} SYP`);
  if (legacyNeedsClearing) {
    for (const a of legacyRows) {
      const syp = Number(a.balanceSYP);
      const usd = Number(a.balanceUSD);
      const side = syp > 0 || (syp === 0 && usd > 0) ? 'Cr' : 'Dr';
      Logger.info(`Entry B (legacy clear): ${side} ${a.code} ${a.nameAr}  =  ${Math.abs(syp).toFixed(2)} SYP / $${Math.abs(usd).toFixed(2)}`);
    }
  } else {
    Logger.info('Entry B (legacy clear): not needed — balances already zero');
  }

  if (dryRun) {
    Logger.info('DRY RUN — nothing was written.');
    return;
  }

  // --- 4. Post ---
  await prisma.$transaction(async (tx) => {
    const equityAccountId = await ensureOpeningEquityAccount(tx);
    const inventoryAccount = await tx.account.findFirst({
      where: { tenantId: TENANT_ID, code: DEFAULT_ACCOUNT_CODES.INVENTORY, deletedAt: null },
      select: { id: true },
    });
    if (!inventoryAccount) throw new Error(`Inventory account ${DEFAULT_ACCOUNT_CODES.INVENTORY} not found`);

    if (inventoryUSD > 0.005 || inventorySYPForEntry > 0.005) {
      await createJournalEntry(
        TENANT_ID,
        new Date(),
        'Opening inventory balance — financial cutover / رصيد المخزون الافتتاحي — الافتتاح المالي',
        'CUTOVER-INVENTORY',
        SOURCE_TYPE,
        'inventory-opening',
        null,
        [
          {
            accountId: inventoryAccount.id,
            debitSYP: inventorySYPForEntry,
            debitUSD: inventoryUSD,
            creditSYP: 0,
            creditUSD: 0,
            description: 'Opening inventory value (priced items only)',
          },
          {
            accountId: equityAccountId,
            debitSYP: 0,
            debitUSD: 0,
            creditSYP: inventorySYPForEntry,
            creditUSD: inventoryUSD,
            description: 'Opening balance equity — inventory',
          },
        ],
        tx
      );
      Logger.info('Posted opening inventory entry');
    }

    if (legacyNeedsClearing) {
      const lines = legacyRows.map((a) => {
        const syp = Number(a.balanceSYP);
        const usd = Number(a.balanceUSD);
        return {
          accountId: a.id,
          debitSYP: syp < 0 ? -syp : 0,
          debitUSD: usd < 0 ? -usd : 0,
          creditSYP: syp > 0 ? syp : 0,
          creditUSD: usd > 0 ? usd : 0,
          description: `Clear legacy balance on ${a.code} ${a.nameAr}`,
        };
      });
      await createJournalEntry(
        TENANT_ID,
        new Date(),
        'Clear legacy opening balances on 1000/1300 — تصفية الأرصدة الافتتاحية القديمة',
        'CUTOVER-LEGACY-CLEAR',
        SOURCE_TYPE,
        'legacy-clear',
        null,
        lines,
        tx
      );
      Logger.info('Posted legacy clearing entry');
    }
  }, { timeout: 30000 });

  // --- 5. Verify ---
  const inv = await getAccountByCode(DEFAULT_ACCOUNT_CODES.INVENTORY);
  const eq = await getAccountByCode(OPENING_EQUITY_CODE);
  Logger.info(`Post-cutover: 1140 = ${inv?.balanceSYP} SYP / $${inv?.balanceUSD}; ${OPENING_EQUITY_CODE} = ${eq?.balanceSYP} SYP / $${eq?.balanceUSD}`);
  for (const code of LEGACY_ACCOUNTS) {
    const a = await getAccountByCode(code);
    if (a) Logger.info(`Post-cutover: ${code} ${a.nameAr} = ${a.balanceSYP} SYP / $${a.balanceUSD}`);
  }
  Logger.info('Financial cutover complete.');
}

if (require.main === module) {
  const dryRun = process.argv.includes('--dry-run');
  run(dryRun)
    .catch((error) => {
      console.error('Financial cutover FAILED:', error);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

export default run;
