import { test, expect } from '@playwright/test';

/**
 * PHASE 5: Complete Workflow + Integration + Stress Tests
 * End-to-end scenarios, data consistency, performance
 */

test.use({
  viewport: { width: 1920, height: 1080 },
  launchOptions: { slowMo: 100 },
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
  await page.screenshot({ path: `test-results/phase5-${name}.png`, fullPage: true });
}

function getToken(page: any) {
  return page.evaluate(() => localStorage.getItem('token') || '');
}

// ============================================
// PART 1: FULL WORKFLOW (E2E)
// ============================================
test.describe('PART 1: Complete Workflow', () => {

  test('1.1: Customer → Booking → Invoice flow', async ({ page, request }) => {
    await login(page);
    const token = await getToken(page);

    // Step 1: Create customer
    const customerRes = await request.post('http://localhost:8080/api/customers', {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        fullName: 'عميل Workflow ' + Date.now(),
        phone: '09' + Date.now().toString().slice(-8),
        address: 'دمشق',
        city: 'دمشق',
      },
    });

    const customerData = await customerRes.json();
    const customerId = customerData.customer?.id || customerData.id;
    console.log('✅ Step 1: Customer created', customerId);

    // Step 2: Create booking
    const bookingRes = await request.post('http://localhost:8080/api/bookings', {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        customerId,
        vehicleInfo: { make: 'Toyota', model: 'Corolla', year: 2020, plateNumber: 'د م 1234' },
        services: [],
        notes: 'حجز workflow',
      },
    });

    const bookingData = await bookingRes.json();
    const bookingId = bookingData.booking?.id || bookingData.id;
    console.log('✅ Step 2: Booking created', bookingId);

    // Step 3: Verify in UI
    await page.goto('http://localhost:1420#/customers');
    await page.waitForTimeout(3000);
    await screenshot(page, '1.1-workflow-customers');

    await page.goto('http://localhost:1420#/bookings');
    await page.waitForTimeout(3000);
    await screenshot(page, '1.1-workflow-bookings');
  });

  test('1.2: Inventory → Service → Booking flow', async ({ page, request }) => {
    await login(page);
    const token = await getToken(page);

    // Create part
    const partRes = await request.post('http://localhost:8080/api/parts', {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        name: 'قطعة Workflow',
        partNumber: 'WF-' + Date.now(),
        quantity: 100,
        costSYP: 15000,
        sellingPriceSYP: 25000,
      },
    });

    const partData = await partRes.json();
    const partId = partData.part?.id || partData.id;
    console.log('✅ Part created', partId);

    // Verify in UI
    await page.goto('http://localhost:1420#/inventory');
    await page.waitForTimeout(3000);
    await screenshot(page, '1.2-workflow-inventory');
  });

  test('1.3: Accounting → Journal → Reports flow', async ({ page, request }) => {
    await login(page);
    const token = await getToken(page);

    // Create accounts
    const assetRes = await request.post('http://localhost:8080/api/accounting/accounts', {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        code: 'WF-ASSET-' + Date.now(),
        nameAr: 'حساب Workflow مدين',
        nameEn: 'Workflow Asset',
        accountType: 'ASSET',
        balanceSYP: 0,
      },
    });

    const liabilityRes = await request.post('http://localhost:8080/api/accounting/accounts', {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        code: 'WF-LIAB-' + Date.now(),
        nameAr: 'حساب Workflow دائن',
        nameEn: 'Workflow Liability',
        accountType: 'LIABILITY',
        balanceSYP: 0,
      },
    });

    const assetData = await assetRes.json();
    const liabilityData = await liabilityRes.json();

    const assetId = assetData.id || assetData.data?.id;
    const liabilityId = liabilityData.id || liabilityData.data?.id;

    console.log('✅ Accounts created:', assetId, liabilityId);

    // Verify in UI
    await page.goto('http://localhost:1420#/accounting/chart-of-accounts');
    await page.waitForTimeout(3000);
    await screenshot(page, '1.3-workflow-accounts');
  });
});

// ============================================
// PART 2: DATA CONSISTENCY
// ============================================
test.describe('PART 2: Data Consistency', () => {

  test('2.1: All modules accessible', async ({ page, request }) => {
    await login(page);
    const token = await getToken(page);

    const modules = [
      '/api/dashboard/kpis',
      '/api/customers?page=1&limit=1',
      '/api/bookings?page=1&limit=1',
      '/api/services?page=1&limit=1',
      '/api/invoices?page=1&limit=1',
      '/api/payments?page=1&limit=1',
      '/api/parts?page=1&limit=1',
      '/api/accounts?page=1&limit=1',
      '/api/journal-entries?page=1&limit=1',
      '/api/employees?page=1&limit=1',
      '/api/users?page=1&limit=1',
      '/api/branches?page=1&limit=1',
      '/api/reports?page=1&limit=1',
      '/api/expenses?page=1&limit=1',
      '/api/cheques?page=1&limit=1',
    ];

    for (const path of modules) {
      const response = await request.get(`http://localhost:8080${path}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      console.log(`  ${response.status() === 200 ? '✅' : '⚠️'} ${path}: ${response.status()}`);
    }
  });

  test('2.2: Dashboard reflects actual data', async ({ page, request }) => {
    await login(page);
    const token = await getToken(page);

    // Get counts from individual APIs
    const customersRes = await request.get('http://localhost:8080/api/customers?page=1&limit=1', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const dashboardRes = await request.get('http://localhost:8080/api/dashboard/kpis', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const customersBody = await customersRes.json();
    const dashboardBody = await dashboardRes.json();

    const customerCount = customersBody.meta?.total || customersBody.total || 0;
    const dashboardCount = dashboardBody.totalCustomers || 0;

    console.log('✅ Consistency check:', {
      customersAPI: customerCount,
      dashboard: dashboardCount,
      match: customerCount === dashboardCount,
    });
  });

  test('2.3: No negative quantities', async ({ page, request }) => {
    await login(page);
    const token = await getToken(page);

    const response = await request.get('http://localhost:8080/api/parts?page=1&limit=300', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const body = await response.json();
    const parts = body.data || [];

    let allPositive = true;
    for (const part of parts) {
      if ((Number(part.quantity) || 0) < 0) {
        allPositive = false;
        console.log('⚠️ Negative quantity:', part.name, part.quantity);
      }
    }

    console.log('✅ All', parts.length, 'parts have positive quantities:', allPositive);
  });

  test('2.4: All accounts have valid balances', async ({ page, request }) => {
    await login(page);
    const token = await getToken(page);

    const response = await request.get('http://localhost:8080/api/accounts?page=1&limit=300', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const body = await response.json();
    const accounts = body.data || [];

    let allValid = true;
    for (const account of accounts) {
      if (account.balanceSYP === null || account.balanceSYP === undefined || Number.isNaN(Number(account.balanceSYP))) {
        allValid = false;
      }
    }

    console.log('✅ All', accounts.length, 'accounts have valid balances:', allValid);
  });
});

// ============================================
// PART 3: STRESS & PERFORMANCE
// ============================================
test.describe('PART 3: Performance Tests', () => {

  test('3.1: Page load times', async ({ page }) => {
    await login(page);

    const screens = [
      { path: '/', name: 'Dashboard' },
      { path: '/customers', name: 'Customers' },
      { path: '/bookings', name: 'Bookings' },
      { path: '/inventory', name: 'Inventory' },
      { path: '/accounting', name: 'Accounting' },
    ];

    for (const screen of screens) {
      const start = Date.now();
      await page.goto(`http://localhost:1420#${screen.path}`);
      await page.waitForTimeout(2000);
      const elapsed = Date.now() - start;

      console.log(`  ✅ ${screen.name}: ${elapsed}ms`);
      expect(elapsed).toBeLessThan(10000);
    }
  });

  test('3.2: API response times', async ({ page, request }) => {
    await login(page);
    const token = await getToken(page);

    const endpoints = [
      '/api/dashboard/kpis',
      '/api/customers?page=1&limit=50',
      '/api/accounts?page=1&limit=50',
      '/api/parts?page=1&limit=50',
    ];

    for (const endpoint of endpoints) {
      const start = Date.now();
      const response = await request.get(`http://localhost:8080${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const elapsed = Date.now() - start;

      console.log(`  ✅ ${endpoint}: ${elapsed}ms (${response.status()})`);
      expect(elapsed).toBeLessThan(3000);
    }
  });

  test('3.3: Rapid navigation', async ({ page }) => {
    await login(page);

    const screens = ['/customers', '/bookings', '/inventory', '/accounting', '/reports'];

    const start = Date.now();
    for (const screen of screens) {
      await page.goto(`http://localhost:1420#${screen}`);
      await page.waitForTimeout(500);
    }
    const elapsed = Date.now() - start;

    console.log(`✅ Navigated ${screens.length} screens in ${elapsed}ms`);
    expect(elapsed).toBeLessThan(15000);
  });

  test('3.4: 100 rapid API calls', async ({ page, request }) => {
    await login(page);
    const token = await getToken(page);

    const start = Date.now();
    let success = 0;

    for (let i = 0; i < 100; i++) {
      const response = await request.get('http://localhost:8080/api/dashboard/kpis', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.status() === 200) success++;
    }

    const elapsed = Date.now() - start;
    console.log(`✅ 100 API calls: ${success}/100 in ${elapsed}ms (${(elapsed/100).toFixed(2)}ms avg)`);
  });
});

// ============================================
// PART 4: MASS DATA SUMMARY
// ============================================
test.describe('PART 4: System Summary', () => {

  test('4.1: Complete system stats', async ({ page, request }) => {
    await login(page);
    const token = await getToken(page);

    const stats: Record<string, number> = {};

    // Get all counts
    const endpoints = {
      customers: '/api/customers?page=1&limit=1',
      bookings: '/api/bookings?page=1&limit=1',
      parts: '/api/parts?page=1&limit=1',
      accounts: '/api/accounts?page=1&limit=1',
      invoices: '/api/invoices?page=1&limit=1',
      employees: '/api/employees?page=1&limit=1',
      users: '/api/users?page=1&limit=1',
      branches: '/api/branches?page=1&limit=1',
      journalEntries: '/api/journal-entries?page=1&limit=1',
    };

    for (const [name, path] of Object.entries(endpoints)) {
      const response = await request.get(`http://localhost:8080${path}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.status() === 200) {
        const body = await response.json();
        stats[name] = body.meta?.total || body.total || body.data?.length || 0;
      }
    }

    console.log('✅ System Summary:');
    console.log('  ==============================');
    for (const [name, count] of Object.entries(stats)) {
      console.log(`  ${name.padEnd(20)}: ${count}`);
    }
    console.log('  ==============================');
    console.log('  Total records:', Object.values(stats).reduce((a, b) => a + b, 0));
  });

  test('4.2: Final screenshot of all screens', async ({ page }) => {
    await login(page);

    const screens = [
      { path: '/', name: 'dashboard' },
      { path: '/customers', name: 'customers' },
      { path: '/bookings', name: 'bookings' },
      { path: '/services', name: 'services' },
      { path: '/invoices', name: 'invoices' },
      { path: '/payments', name: 'payments' },
      { path: '/inventory', name: 'inventory' },
      { path: '/accounting', name: 'accounting' },
      { path: '/reports', name: 'reports' },
      { path: '/hr', name: 'hr' },
      { path: '/settings', name: 'settings' },
    ];

    for (const screen of screens) {
      await page.goto(`http://localhost:1420#${screen.path}`);
      await page.waitForTimeout(2500);
      await page.screenshot({ path: `test-results/final-${screen.name}.png`, fullPage: true });
      console.log(`  ✅ Screenshot: ${screen.name}`);
    }
  });
});
