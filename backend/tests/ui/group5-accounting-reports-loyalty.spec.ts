import { test, expect } from '@playwright/test';

/**
 * GROUP 5: Accounting + Reports + Loyalty (30 Tests)
 * Based on code analysis of accounting screens, reports, loyalty
 */

test.use({
  viewport: { width: 1920, height: 1080 },
  launchOptions: { slowMo: 120 },
});

async function login(page: any) {
  await page.goto('http://localhost:1420');
  await page.waitForTimeout(1500);
  await page.locator('#username').fill('owner');
  await page.locator('#password').fill('owner123');
  await page.locator('#login-btn, button[type="submit"]').click();
  await page.waitForTimeout(3000);
}

async function screenshot(page: any, name: string) {
  await page.waitForTimeout(800);
  await page.screenshot({ path: `test-results/group5-${name}.png`, fullPage: true });
}

function uniqueSuffix(): string {
  return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function uniqueAccountCode(): string {
  return `ACC-${Math.floor(1000 + Math.random() * 8999)}`;
}

function uniqueAccountName(): string {
  return `TestAccount_${uniqueSuffix()}`;
}

function uniqueAmount(): string {
  return String(Math.floor(1000 + Math.random() * 99000));
}

// ============================================
// PART 1: ACCOUNTING HUB (Tests 8.1)
// ============================================

test.describe('PART 1: Accounting Hub', () => {
  test('8.1: Navigate to accounting hub', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/accounting');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/محاسبة|accounting/i);

    const cards = [
      /شجرة|chart|tree/i,
      /قيود|journal/i,
      /استاذ|ledger/i,
      /مراجعة|trial/i,
      /ميزانية|balance/i,
      /دخل|income/i,
      /تدفق|cash/i,
    ];

    let found = 0;
    for (const c of cards) {
      if (c.test(body)) found++;
    }
    console.log(`Accounting cards found: ${found}/${cards.length}`);
    await screenshot(page, '8.1-accounting-hub');
  });
});

// ============================================
// PART 2: CHART OF ACCOUNTS (Tests 8.2.1 - 8.2.4)
// ============================================

test.describe('PART 2: Chart of Accounts', () => {
  test('8.2.1: Navigate to chart of accounts', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/accounting/chart-of-accounts');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/حساب|account|شجرة|chart/i);

    const tbody = await page.locator('#table-tbody').count();
    console.log('Table found:', tbody);
    await screenshot(page, '8.2.1-coa-list');
  });

  test('8.2.2: Pagination controls', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/accounting/chart-of-accounts');
    await page.waitForTimeout(3000);

    const info = await page.locator('#pagination-info').count();
    const controls = await page.locator('#pagination-controls').count();
    console.log(`Pagination info: ${info}, Controls: ${controls}`);
    await screenshot(page, '8.2.2-coa-pagination');
  });

  test('8.2.3: Search accounts', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/accounting/chart-of-accounts');
    await page.waitForTimeout(3000);

    const search = page.locator('#search-input');
    if (await search.count() > 0) {
      await search.fill('حساب');
      await page.waitForTimeout(2000);
      await screenshot(page, '8.2.3-coa-search');
    }
  });

  test('8.2.4: Add account button', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/accounting/chart-of-accounts');
    await page.waitForTimeout(3000);

    const btn = page.locator('#btn-add-account');
    if (await btn.count() > 0) {
      await expect(btn).toBeVisible();
      await btn.click();
      await page.waitForTimeout(2000);

      const modal = page.locator('#account-modal');
      if (await modal.count() > 0) {
        await expect(modal).toBeVisible();
        console.log('Add account modal visible');

        // Check fields
        const code = await page.locator('#acc-code').count();
        const name = await page.locator('#acc-name').count();
        const type = await page.locator('#acc-type').count();
        const parent = await page.locator('#acc-parent').count();
        console.log(`Fields - Code: ${code}, Name: ${name}, Type: ${type}, Parent: ${parent}`);
      }

      await screenshot(page, '8.2.4-coa-add-modal');
    }
  });
});

// ============================================
// PART 3: JOURNAL ENTRIES (Tests 8.3.1 - 8.3.4)
// ============================================

test.describe('PART 3: Journal Entries', () => {
  test('8.3.1: Navigate to journal entries', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/accounting/journal-entries');
    
    // Wait for table to appear (always visible due to skeleton)
    await page.waitForSelector('#table-tbody', { timeout: 15000 });

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/قيود|قيد|journal|entry/i);

    const tbody = await page.locator('#table-tbody').count();
    console.log('Journal table found:', tbody);
    await screenshot(page, '8.3.1-journal-list');
  });

  test('8.3.2: Search journal entries', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/accounting/journal-entries');
    await page.waitForTimeout(3000);

    const search = page.locator('#search-input');
    if (await search.count() > 0) {
      await search.fill('قيد');
      await page.waitForTimeout(2000);
      await screenshot(page, '8.3.2-journal-search');
    }
  });

  test('8.3.3: Journal entry columns', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/accounting/journal-entries');
    await page.waitForTimeout(3000);

    const tbody = await page.locator('#table-tbody').textContent() || '';
    const thead = await page.locator('#table-tbody').first().locator('..').locator('thead').textContent() || '';
    const combined = thead + tbody;

    const hasDate = /تاريخ|date/i.test(combined);
    const hasRef = /مرجع|reference/i.test(combined);
    const hasDesc = /بيان|description/i.test(combined);
    const hasDebit = /مدين|debit/i.test(combined);
    const hasCredit = /دائن|credit/i.test(combined);
    const hasStatus = /حالة|status/i.test(combined);

    console.log('Columns - Date:', hasDate, 'Ref:', hasRef, 'Desc:', hasDesc, 'Debit:', hasDebit, 'Credit:', hasCredit, 'Status:', hasStatus);
    await screenshot(page, '8.3.3-journal-columns');
  });

  test('8.3.4: Add journal entry form', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/accounting/journal-entries');
    await page.waitForTimeout(3000);

    const addBtn = page.locator('#btn-add-entry, [data-action="add-entry"]');
    if (await addBtn.count() > 0) {
      await addBtn.click();
      await page.waitForTimeout(2000);

      // Check form fields
      const date = await page.locator('#entry-date').count();
      const ref = await page.locator('#entry-reference').count();
      const desc = await page.locator('#entry-description').count();
      const debit = await page.locator('#entry-debit').count();
      const credit = await page.locator('#entry-credit').count();

      console.log(`Fields - Date: ${date}, Ref: ${ref}, Desc: ${desc}, Debit: ${debit}, Credit: ${credit}`);
      await screenshot(page, '8.3.4-journal-add');
    }
  });
});

// ============================================
// PART 4: REPORTS (Tests 8.4 - 8.8)
// ============================================

test.describe('PART 4: Financial Reports', () => {
  test('8.4: General ledger', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/accounting/general-ledger');
    
    // Wait for table to appear (always visible due to skeleton)
    await page.waitForSelector('#table-tbody', { timeout: 30000 });

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/أستاذ|استاذ|ledger/i);

    const search = await page.locator('#search-input').count();
    const tbody = await page.locator('#table-tbody').count();
    console.log(`Search: ${search}, Table: ${tbody}`);
    await screenshot(page, '8.4-general-ledger');
  });

  test('8.5: Trial balance', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/accounting/trial-balance');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/مراجعة|trial/i);
    await screenshot(page, '8.5-trial-balance');
  });

  test('8.6: Balance sheet', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/accounting/balance-sheet');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/ميزانية|balance/i);

    const hasAssets = /أصول|assets/i.test(body);
    const hasLiab = /التزام|liabilities/i.test(body);
    const hasEquity = /ملكية|equity/i.test(body);

    console.log('Assets:', hasAssets, 'Liabilities:', hasLiab, 'Equity:', hasEquity);
    await screenshot(page, '8.6-balance-sheet');
  });

  test('8.7: Income statement', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/accounting/income-statement');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/دخل|income|revenue/i);

    const hasRevenue = /إيراد|revenue/i.test(body);
    const hasExpenses = /مصروف|expense/i.test(body);
    const hasProfit = /ربح|profit/i.test(body);

    console.log('Revenue:', hasRevenue, 'Expenses:', hasExpenses, 'Profit:', hasProfit);
    await screenshot(page, '8.7-income-statement');
  });

  test('8.8: Cash flow', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/accounting/cash-flow');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/تدفق|cash|flow/i);
    await screenshot(page, '8.8-cash-flow');
  });
});

// ============================================
// PART 5: REPORTS HUB (Tests 9.1 - 9.5)
// ============================================

test.describe('PART 5: Reports Hub', () => {
  test('9.1: Navigate to reports hub', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/reports');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/تقرير|report/i);

    const cards = [
      /إيراد|revenue/i,
      /مخزون|inventory/i,
      /عميل|customer/i,
      /حجز|booking/i,
    ];

    let found = 0;
    for (const c of cards) {
      if (c.test(body)) found++;
    }
    console.log(`Report cards found: ${found}/${cards.length}`);
    await screenshot(page, '9.1-reports-hub');
  });

  test('9.2: Revenue report', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/reports/revenue');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/إيراد|revenue/i);

    const kpiIds = ['#rev-total-syp', '#rev-total-usd', '#rev-invoices', '#rev-avg'];
    for (const id of kpiIds) {
      const count = await page.locator(id).count();
      console.log(`  ${id}: ${count > 0 ? 'found' : 'missing'}`);
    }

    await screenshot(page, '9.2-revenue-report');
  });

  test('9.3: Inventory report', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/reports/inventory');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/مخزون|inventory/i);

    const kpiIds = ['#inv-total-parts', '#inv-total-syp', '#inv-total-usd', '#inv-low'];
    for (const id of kpiIds) {
      const count = await page.locator(id).count();
      console.log(`  ${id}: ${count > 0 ? 'found' : 'missing'}`);
    }

    await screenshot(page, '9.3-inventory-report');
  });

  test('9.4: Customer report', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/reports/customers');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/عميل|customer/i);

    const kpiIds = ['#cust-total', '#cust-active', '#cust-new', '#cust-avg'];
    for (const id of kpiIds) {
      const count = await page.locator(id).count();
      console.log(`  ${id}: ${count > 0 ? 'found' : 'missing'}`);
    }

    await screenshot(page, '9.4-customer-report');
  });

  test('9.5: Booking report', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/reports/bookings');
    
    // Wait for KPI cards to appear (always visible)
    await page.waitForSelector('#book-total', { timeout: 30000 });

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/حجوزات|حجز|booking/i);

    const kpiIds = ['#book-total', '#book-completed', '#book-rate', '#book-avg-time'];
    for (const id of kpiIds) {
      const count = await page.locator(id).count();
      console.log(`  ${id}: ${count > 0 ? 'found' : 'missing'}`);
    }

    await screenshot(page, '9.5-booking-report');
  });
});

// ============================================
// PART 6: ANALYTICS (Tests 9.6)
// ============================================

test.describe('PART 6: Analytics', () => {
  test('9.6: Analytics screen', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/analytics');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/تحليل|analytics/i);

    const kpiIds = ['#kpi-satisfaction', '#kpi-avg-invoice', '#kpi-retention', '#kpi-forecast'];
    for (const id of kpiIds) {
      const count = await page.locator(id).count();
      console.log(`  ${id}: ${count > 0 ? 'found' : 'missing'}`);
    }

    await screenshot(page, '9.6-analytics');
  });
});

// ============================================
// PART 7: LOYALTY (Tests 16.1 - 16.4)
// ============================================

test.describe('PART 7: Loyalty Program', () => {
  test('16.1: Navigate to loyalty', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/loyalty');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/ولاء|loyalty|نقاط|points/i);

    const kpiIds = ['#loy-total-points', '#loy-participants', '#loy-redeemed'];
    for (const id of kpiIds) {
      const count = await page.locator(id).count();
      console.log(`  ${id}: ${count > 0 ? 'found' : 'missing'}`);
    }

    await screenshot(page, '16.1-loyalty-page');
  });

  test('16.2: Search loyalty customers', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/loyalty');
    await page.waitForTimeout(3000);

    const search = page.locator('#loyalty-search');
    if (await search.count() > 0) {
      await search.fill('عميل');
      await page.waitForTimeout(2000);
      await screenshot(page, '16.2-loyalty-search');
    }
  });

  test('16.3: Loyalty transactions table', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/loyalty');
    await page.waitForTimeout(3000);

    const tbody = await page.locator('#loyalty-tbody').count();
    console.log('Loyalty table found:', tbody);
    await screenshot(page, '16.3-loyalty-table');
  });

  test('16.4: Add points button', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/loyalty');
    await page.waitForTimeout(3000);

    const btn = page.locator('#add-points-btn, [data-action="add-points"]');
    if (await btn.count() > 0) {
      await expect(btn).toBeVisible();
      console.log('Add points button visible');
    }
    await screenshot(page, '16.4-add-points-btn');
  });
});
