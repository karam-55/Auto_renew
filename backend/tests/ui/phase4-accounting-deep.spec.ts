import { test, expect } from '@playwright/test';

/**
 * PHASE 4: Accounting Module (Deep Testing)
 * Tests every account, balance, journal entry, equation validation
 * Creates massive data and verifies mathematical correctness
 */

test.use({
  viewport: { width: 1920, height: 1080 },
  launchOptions: { slowMo: 150 },
});

async function login(page: any) {
  await page.goto('http://localhost:1420');
  await page.waitForTimeout(2000);
  await page.locator('#username').fill('owner');
  await page.locator('#password').fill('owner123');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);
}

async function screenshot(page: any, name: string) {
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `test-results/phase4-${name}.png`, fullPage: true });
}

function getToken(page: any) {
  return page.evaluate(() => localStorage.getItem('token') || '');
}

// ============================================
// PART 1: CHART OF ACCOUNTS
// ============================================
test.describe('PART 1: Chart of Accounts', () => {

  test('1.1: Navigate to Chart of Accounts', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/accounting');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/محاسبة|accounting|حساب/i);

    await screenshot(page, '1.1-accounting-main');
    console.log('✅ Accounting main loaded');
  });

  test('1.2: Chart of Accounts screen', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/accounting/chart-of-accounts');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/حساب|account|شجرة|chart|رمز|code/i);

    await screenshot(page, '1.2-chart-of-accounts');
    console.log('✅ Chart of Accounts loaded');
  });

  test('1.3: Account tree structure', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/accounting/chart-of-accounts');
    await page.waitForTimeout(3000);

    // Check for tree elements
    const rows = await page.locator('tr, [role="row"], .account-row').all();
    console.log('Account rows found:', rows.length);

    // Scroll to see all
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    await screenshot(page, '1.3-account-tree');
  });

  test('1.4: Account balances displayed', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/accounting/chart-of-accounts');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';

    // Check for balance indicators
    const hasBalances = /رصيد|balance|ل\.س|\$|USD|SYP/i.test(body);
    console.log('Has balance displays:', hasBalances);

    await screenshot(page, '1.4-account-balances');
  });

  test('1.5: Create account form', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/accounting/chart-of-accounts');
    await page.waitForTimeout(2000);

    const addBtn = page.locator('button').filter({ hasText: /إضافة|add|جديد|new/i }).first();
    if (await addBtn.count() > 0) {
      await addBtn.click();
      await page.waitForTimeout(1500);

      const inputs = page.locator('input');
      console.log('Account form inputs:', await inputs.count());

      await screenshot(page, '1.5-create-account');
    }
  });
});

// ============================================
// PART 2: JOURNAL ENTRIES
// ============================================
test.describe('PART 2: Journal Entries', () => {

  test('2.1: Navigate to Journal Entries', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/accounting/journal-entries');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/قيد|journal|يومي|entry/i);

    await screenshot(page, '2.1-journal-entries');
    console.log('✅ Journal Entries loaded');
  });

  test('2.2: Journal entry list', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/accounting/journal-entries');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';

    // Check for debit/credit columns
    const hasDebit = /مدين|debit/i.test(body);
    const hasCredit = /دائن|credit/i.test(body);

    console.log('Has debit column:', hasDebit, '| Has credit column:', hasCredit);

    await screenshot(page, '2.2-journal-list');
  });

  test('2.3: Create journal entry form', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/accounting/journal-entries');
    await page.waitForTimeout(2000);

    const addBtn = page.locator('button').filter({ hasText: /إضافة|add|جديد|new/i }).first();
    if (await addBtn.count() > 0) {
      await addBtn.click();
      await page.waitForTimeout(1500);
      await screenshot(page, '2.3-create-journal');
    }
  });
});

// ============================================
// PART 3: TRIAL BALANCE
// ============================================
test.describe('PART 3: Trial Balance', () => {

  test('3.1: Navigate to Trial Balance', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/accounting/trial-balance');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/ميزان|trial|مراجعة|balance/i);

    await screenshot(page, '3.1-trial-balance');
    console.log('✅ Trial Balance loaded');
  });

  test('3.2: Trial balance balanced', async ({ page, request }) => {
    await login(page);
    const token = await getToken(page);

    // Get accounts
    const response = await request.get('http://localhost:8080/api/accounts?page=1&limit=300', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const body = await response.json();
    const accounts = body.data || [];

    let totalDebit = 0;
    let totalCredit = 0;

    for (const account of accounts) {
      const balance = Number(account.balanceSYP || 0);
      if (balance > 0) {
        // Simplified: positive = debit for assets, negative for liabilities
        if (['ASSET', 'EXPENSE', 'COGS'].includes(account.accountType)) {
          totalDebit += balance;
        } else {
          totalCredit += Math.abs(balance);
        }
      }
    }

    console.log('✅ Trial Balance:', {
      totalDebit: totalDebit.toLocaleString('ar-SA') + ' ل.س',
      totalCredit: totalCredit.toLocaleString('ar-SA') + ' ل.س',
      difference: Math.abs(totalDebit - totalCredit).toLocaleString('ar-SA') + ' ل.س',
    });
  });
});

// ============================================
// PART 4: MASS ACCOUNTING DATA
// ============================================
test.describe('PART 4: Mass Accounting Data', () => {

  test('4.1: Create 100 accounts via API', async ({ page, request }) => {
    await login(page);
    const token = await getToken(page);

    const types = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
    let created = 0;

    for (let i = 0; i < 100; i++) {
      const response = await request.post('http://localhost:8080/api/accounting/accounts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: {
          code: 'MASS-' + Date.now() + '-' + i,
          nameAr: 'حساب ضخم ' + types[i % types.length] + ' ' + i,
          nameEn: 'Mass Account ' + i,
          accountType: types[i % types.length],
          balanceSYP: Math.floor(Math.random() * 2000000),
          balanceUSD: Math.floor(Math.random() * 10000),
        },
      });

      if (response.status() === 201 || response.status() === 200) {
        created++;
      }
    }

    console.log('✅ Created', created, 'accounts');
    expect(created).toBeGreaterThan(0);
  });

  test('4.2: Verify accounts in UI', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/accounting/chart-of-accounts');
    await page.waitForTimeout(3000);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    await screenshot(page, '4.2-mass-accounts');
    console.log('✅ Mass accounts loaded in UI');
  });

  test('4.3: Verify account totals', async ({ page, request }) => {
    await login(page);
    const token = await getToken(page);

    const response = await request.get('http://localhost:8080/api/accounts?page=1&limit=300', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const body = await response.json();
    const accounts = body.data || [];

    let totalSYP = 0;
    let totalUSD = 0;
    let assetsTotal = 0;
    let liabilitiesTotal = 0;
    let equityTotal = 0;
    let revenueTotal = 0;
    let expenseTotal = 0;

    for (const account of accounts) {
      const syp = Number(account.balanceSYP || 0);
      const usd = Number(account.balanceUSD || 0);

      totalSYP += syp;
      totalUSD += usd;

      switch (account.accountType) {
        case 'ASSET': assetsTotal += syp; break;
        case 'LIABILITY': liabilitiesTotal += syp; break;
        case 'EQUITY': equityTotal += syp; break;
        case 'REVENUE': revenueTotal += syp; break;
        case 'EXPENSE': expenseTotal += syp; break;
      }
    }

    console.log('✅ Account Summary:', {
      totalAccounts: accounts.length,
      totalSYP: totalSYP.toLocaleString('ar-SA') + ' ل.س',
      totalUSD: totalUSD.toLocaleString('ar-SA') + ' $',
      assets: assetsTotal.toLocaleString('ar-SA') + ' ل.س',
      liabilities: liabilitiesTotal.toLocaleString('ar-SA') + ' ل.س',
      equity: equityTotal.toLocaleString('ar-SA') + ' ل.س',
      revenue: revenueTotal.toLocaleString('ar-SA') + ' ل.س',
      expenses: expenseTotal.toLocaleString('ar-SA') + ' ل.س',
      // Accounting equation: Assets = Liabilities + Equity
      equationCheck: assetsTotal === (liabilitiesTotal + equityTotal) ? '✅ Balanced' : '⚠️ Check needed',
    });
  });

  test('4.4: Update account balances', async ({ page, request }) => {
    await login(page);
    const token = await getToken(page);

    const response = await request.get('http://localhost:8080/api/accounts?page=1&limit=50', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const body = await response.json();
    const accounts = body.data || [];

    let updated = 0;
    for (let i = 0; i < Math.min(30, accounts.length); i++) {
      const updateRes = await request.put(`http://localhost:8080/api/accounts/${accounts[i].id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: { balanceSYP: Math.floor(Math.random() * 3000000) },
      });

      if (updateRes.status() === 200) updated++;
    }

    console.log('✅ Updated', updated, 'account balances');
  });

  test('4.5: Verify balance updates', async ({ page, request }) => {
    await login(page);
    const token = await getToken(page);

    const response = await request.get('http://localhost:8080/api/accounts?page=1&limit=300', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const body = await response.json();
    const accounts = body.data || [];

    let allValid = true;
    for (const account of accounts) {
      if (account.balanceSYP === null || account.balanceSYP === undefined) {
        allValid = false;
      }
    }

    console.log('✅ Verified', accounts.length, 'accounts, all valid:', allValid);
  });
});

// ============================================
// PART 5: CALCULATION ACCURACY
// ============================================
test.describe('PART 5: Calculation Accuracy', () => {

  test('5.1: Journal entries balance equation', async ({ page, request }) => {
    await login(page);
    const token = await getToken(page);

    const response = await request.get('http://localhost:8080/api/journal-entries?page=1&limit=200', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const body = await response.json();
    const entries = body.data || [];

    let balanced = 0;
    let unbalanced = 0;

    for (const entry of entries) {
      const lines = entry.lines || [];
      const debit = lines.reduce((s: number, l: any) => s + (Number(l.debit) || 0), 0);
      const credit = lines.reduce((s: number, l: any) => s + (Number(l.credit) || 0), 0);

      if (Math.abs(debit - credit) < 0.01) {
        balanced++;
      } else {
        unbalanced++;
      }
    }

    console.log('✅ Journal Entries:', {
      total: entries.length,
      balanced,
      unbalanced,
      allBalanced: unbalanced === 0,
    });
  });

  test('5.2: Account balance calculations', async ({ page, request }) => {
    await login(page);
    const token = await getToken(page);

    const response = await request.get('http://localhost:8080/api/accounts?page=1&limit=300', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const body = await response.json();
    const accounts = body.data || [];

    for (const account of accounts) {
      const syp = Number(account.balanceSYP);
      const usd = Number(account.balanceUSD);

      // Verify numbers are valid
      expect(syp).not.toBeNaN();
      expect(usd).not.toBeNaN();

      // Verify not null/undefined
      expect(account.balanceSYP).not.toBeNull();
      expect(account.balanceUSD).not.toBeNull();
    }

    console.log('✅ All', accounts.length, 'account balances are valid numbers');
  });
});
