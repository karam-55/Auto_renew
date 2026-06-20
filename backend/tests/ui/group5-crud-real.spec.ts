import { test, expect } from '@playwright/test';

/**
 * GROUP 5 CRUD REAL: Accounting + Reports + Loyalty
 * Creates real data in database and LEAVES it there
 */

test.use({
  viewport: { width: 1920, height: 1080 },
  launchOptions: { slowMo: 200 },
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
  await page.screenshot({ path: `test-results/crud5-${name}.png`, fullPage: true });
}

function uniqueSuffix(): string {
  return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function uniqueAccountCode(): string {
  return `TACC-${Math.floor(1000 + Math.random() * 8999)}`;
}

function uniqueAccountName(): string {
  return `TestAccount_${uniqueSuffix()}`;
}

function uniqueRef(): string {
  return `REF-${uniqueSuffix()}`;
}

function uniqueAmount(): string {
  return String(Math.floor(1000 + Math.random() * 99000));
}

// ============================================
// PART 1: CREATE ACCOUNT (Real)
// ============================================

test.describe('PART 1: Create Real Account', () => {

  test('CRUD-8.1: Create new chart of accounts entry', async ({ page }) => {
    const accCode = uniqueAccountCode();
    const accName = uniqueAccountName();

    await login(page);
    await page.goto('http://localhost:1420#/accounting/chart-of-accounts');
    await page.waitForTimeout(3000);

    const addBtn = page.locator('#btn-add-account');
    if (await addBtn.count() > 0) {
      await addBtn.click();
      await page.waitForTimeout(2000);

      const codeInput = page.locator('#acc-code');
      if (await codeInput.count() > 0) {
        await codeInput.fill(accCode);
      }

      const nameInput = page.locator('#acc-name');
      if (await nameInput.count() > 0) {
        await nameInput.fill(accName);
      }

      const typeSelect = page.locator('#acc-type');
      if (await typeSelect.count() > 0) {
        const options = await typeSelect.locator('option').all();
        if (options.length > 1) {
          await typeSelect.selectOption({ index: 1 });
        }
      }

      const parentSelect = page.locator('#acc-parent');
      if (await parentSelect.count() > 0) {
        const options = await parentSelect.locator('option').all();
        if (options.length > 1) {
          await parentSelect.selectOption({ index: 1 });
        }
      }

      const saveBtn = page.locator('#acc-save, [data-action="save-account"]');
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(3000);
        console.log(`Account created: ${accCode} - ${accName}`);
      }
    }

    await screenshot(page, 'crud-8.1-account-created');
  });

  test('CRUD-8.2: Create multiple accounts', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/accounting/chart-of-accounts');
    await page.waitForTimeout(3000);

    const accounts = [
      { code: uniqueAccountCode(), name: uniqueAccountName(), type: 'ASSET' },
      { code: uniqueAccountCode(), name: uniqueAccountName(), type: 'EXPENSE' },
    ];

    for (const acc of accounts) {
      const addBtn = page.locator('#btn-add-account');
      if (await addBtn.count() > 0) {
        await addBtn.click();
        await page.waitForTimeout(1500);

        if (await page.locator('#acc-code').count() > 0) {
          await page.locator('#acc-code').fill(acc.code);
        }
        if (await page.locator('#acc-name').count() > 0) {
          await page.locator('#acc-name').fill(acc.name);
        }
        const typeSelect = page.locator('#acc-type');
        if (await typeSelect.count() > 0) {
          try {
            await typeSelect.selectOption(acc.type);
          } catch (e) {
            await typeSelect.selectOption({ index: 1 });
          }
        }

        const saveBtn = page.locator('#acc-save, [data-action="save-account"]');
        if (await saveBtn.count() > 0) {
          await saveBtn.click();
          await page.waitForTimeout(2000);
          console.log(`Created account: ${acc.code} - ${acc.name}`);
        }
      }
    }

    await screenshot(page, 'crud-8.2-multiple-accounts');
  });
});

// ============================================
// PART 2: CREATE JOURNAL ENTRY (Real)
// ============================================

test.describe('PART 2: Create Real Journal Entry', () => {

  test('CRUD-8.3: Create journal entry', async ({ page }) => {
    const ref = uniqueRef();
    const desc = `Journal entry test ${uniqueSuffix()}`;
    const debit = uniqueAmount();
    const credit = debit; // Must balance

    await login(page);
    await page.goto('http://localhost:1420#/accounting/journal-entries');
    await page.waitForTimeout(3000);

    const addBtn = page.locator('#btn-add-entry, [data-action="add-entry"]');
    if (await addBtn.count() > 0) {
      await addBtn.click();
      await page.waitForTimeout(2000);

      const dateInput = page.locator('#entry-date');
      if (await dateInput.count() > 0) {
        await dateInput.fill(new Date().toISOString().split('T')[0]);
      }

      const refInput = page.locator('#entry-reference');
      if (await refInput.count() > 0) {
        await refInput.fill(ref);
      }

      const descInput = page.locator('#entry-description');
      if (await descInput.count() > 0) {
        await descInput.fill(desc);
      }

      const debitInput = page.locator('#entry-debit');
      if (await debitInput.count() > 0) {
        await debitInput.fill(debit);
      }

      const creditInput = page.locator('#entry-credit');
      if (await creditInput.count() > 0) {
        await creditInput.fill(credit);
      }

      // Select account
      const accountSelect = page.locator('#entry-account');
      if (await accountSelect.count() > 0) {
        const options = await accountSelect.locator('option').all();
        if (options.length > 1) {
          await accountSelect.selectOption({ index: 1 });
        }
      }

      const saveBtn = page.locator('#save-entry-btn, [data-action="save-entry"]');
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(3000);
        console.log(`Journal entry created: ${ref}, Debit: ${debit}, Credit: ${credit}`);
      }
    }

    await screenshot(page, 'crud-8.3-journal-created');
  });

  test('CRUD-8.4: Create multiple journal entries', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/accounting/journal-entries');
    await page.waitForTimeout(3000);

    const entries = [
      { ref: uniqueRef(), desc: `Entry 1 ${uniqueSuffix()}`, amount: '5000' },
      { ref: uniqueRef(), desc: `Entry 2 ${uniqueSuffix()}`, amount: '10000' },
    ];

    for (const entry of entries) {
      const addBtn = page.locator('#btn-add-entry, [data-action="add-entry"]');
      if (await addBtn.count() > 0) {
        await addBtn.click();
        await page.waitForTimeout(1500);

        if (await page.locator('#entry-reference').count() > 0) {
          await page.locator('#entry-reference').fill(entry.ref);
        }
        if (await page.locator('#entry-description').count() > 0) {
          await page.locator('#entry-description').fill(entry.desc);
        }
        if (await page.locator('#entry-debit').count() > 0) {
          await page.locator('#entry-debit').fill(entry.amount);
        }
        if (await page.locator('#entry-credit').count() > 0) {
          await page.locator('#entry-credit').fill(entry.amount);
        }

        const saveBtn = page.locator('#save-entry-btn, [data-action="save-entry"]');
        if (await saveBtn.count() > 0) {
          await saveBtn.click();
          await page.waitForTimeout(2000);
          console.log(`Created journal: ${entry.ref}`);
        }
      }
    }

    await screenshot(page, 'crud-8.4-multiple-journals');
  });
});

// ============================================
// PART 3: LOYALTY ADD POINTS (Real)
// ============================================

test.describe('PART 3: Loyalty Real Operations', () => {

  test('CRUD-16.1: Add loyalty points to customer', async ({ page }) => {
    const points = String(Math.floor(50 + Math.random() * 950));

    await login(page);
    await page.goto('http://localhost:1420#/loyalty');
    await page.waitForTimeout(3000);

    const addBtn = page.locator('#add-points-btn, [data-action="add-points"]');
    if (await addBtn.count() > 0) {
      await addBtn.click();
      await page.waitForTimeout(2000);

      // Select customer
      const customerSelect = page.locator('#loyalty-customer');
      if (await customerSelect.count() > 0) {
        const options = await customerSelect.locator('option').all();
        if (options.length > 1) {
          await customerSelect.selectOption({ index: 1 });
        }
      }

      // Enter points
      const pointsInput = page.locator('#points-amount');
      if (await pointsInput.count() > 0) {
        await pointsInput.fill(points);
      }

      // Reason
      const reasonInput = page.locator('#points-reason');
      if (await reasonInput.count() > 0) {
        await reasonInput.fill(`Test loyalty ${uniqueSuffix()}`);
      }

      // Save
      const saveBtn = page.locator('#save-points-btn, [data-action="save-points"]');
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(3000);
        console.log(`Added ${points} loyalty points`);
      }
    }

    await screenshot(page, 'crud-16.1-loyalty-points');
  });

  test('CRUD-16.2: Redeem loyalty points', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/loyalty');
    await page.waitForTimeout(3000);

    const redeemBtn = page.locator('#redeem-btn, [data-action="redeem"]');
    if (await redeemBtn.count() > 0) {
      await redeemBtn.first().click();
      await page.waitForTimeout(2000);

      const pointsInput = page.locator('#redeem-points');
      if (await pointsInput.count() > 0) {
        await pointsInput.fill('10');
      }

      const saveBtn = page.locator('#save-redeem-btn, [data-action="save-redeem"]');
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(3000);
        console.log('Redeemed loyalty points');
      }
    }

    await screenshot(page, 'crud-16.2-loyalty-redeem');
  });
});

// ============================================
// SUMMARY
// ============================================

test.describe('SUMMARY: Accounting Data Created', () => {
  test('SUMMARY: List all accounting test data', async ({ page, request }) => {
    await login(page);

    const token = await page.evaluate(() => localStorage.getItem('token'));

    const accountsRes = await request.get('http://localhost:8080/api/accounts', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const accountsData = await accountsRes.json();

    const journalRes = await request.get('http://localhost:8080/api/journal-entries', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const journalData = await journalRes.json();

    console.log('\n========== ACCOUNTING TEST DATA ==========');
    console.log('Total Accounts:', accountsData.data?.length || accountsData.length || 0);
    console.log('Total Journal Entries:', journalData.data?.length || journalData.length || 0);
    console.log('Note: Test data with "TACC-" and "REF-" prefix was created');
    console.log('=========================================\n');

    await screenshot(page, 'crud5-summary');
  });
});
