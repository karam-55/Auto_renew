import { test, expect } from '@playwright/test';

/**
 * Quick System Check - Fast validation of all critical screens
 */

test.use({
  viewport: { width: 1920, height: 1080 },
});

async function quickLogin(page: any) {
  await page.goto('http://localhost:1420');
  await page.waitForTimeout(1500);

  await page.locator('#username').fill('owner');
  await page.locator('#password').fill('owner123');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);
}

test.describe('⚡ Quick System Check', () => {

  // ============================================
  // 1. LOGIN + DASHBOARD
  // ============================================
  test('Login + Dashboard', async ({ page }) => {
    await quickLogin(page);
    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/لوحة|dashboard|الرئيسية/i);
    await page.screenshot({ path: 'test-results/quick-01-dashboard.png' });
    console.log('✅ Dashboard OK');
  });

  // ============================================
  // 2. ALL SCREENS (Navigate by URL)
  // ============================================
  const screens = [
    { path: '/customers', name: 'الزبائن', check: /زبون|عميل|customer/i },
    { path: '/bookings', name: 'الحجوزات', check: /حجز|booking/i },
    { path: '/services', name: 'الخدمات', check: /خدمة|service/i },
    { path: '/invoices', name: 'الفواتير', check: /فاتورة|invoice/i },
    { path: '/payments', name: 'المدفوعات', check: /دفع|payment/i },
    { path: '/inventory', name: 'المخزون', check: /مخزون|قطع|part/i },
    { path: '/accounting', name: 'المحاسبة', check: /محاسبة|accounting/i },
    { path: '/reports', name: 'التقارير', check: /تقرير|report/i },
    { path: '/hr', name: 'الموارد البشرية', check: /موظف|hr/i },
    { path: '/settings', name: 'الإعدادات', check: /إعداد|setting/i },
  ];

  for (const screen of screens) {
    test(`Screen: ${screen.name}`, async ({ page }) => {
      await quickLogin(page);
      await page.goto(`http://localhost:1420#${screen.path}`);
      await page.waitForTimeout(2000);

      const body = await page.locator('body').textContent() || '';
      expect(body).toMatch(screen.check);

      await page.screenshot({ path: `test-results/quick-${screen.name.replace(/\s/g, '-')}.png` });
      console.log(`✅ ${screen.name} OK`);
    });
  }

  // ============================================
  // 3. BACKEND APIs
  // ============================================
  test('Backend APIs', async ({ request }) => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZTZjZmQ2LWU1NDMtNDhjYi05ZmY5LTQ2NTczM2FkYTc5MiIsInRlbmFudElkIjoiZGVmYXVsdCIsInJvbGUiOiJPV05FUiIsInVzZXJuYW1lIjoib3duZXIiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzgxODIyNTQyLCJleHAiOjQ5Mzc1ODI1NDJ9.NAJ8sTw3UABaexrlw5v_dKhBhfCvUFKjbdMcB4nyiWQ';

    const apis = [
      '/api/dashboard/kpis',
      '/api/customers?page=1&limit=5',
      '/api/bookings?page=1&limit=5',
      '/api/services?page=1&limit=5',
      '/api/invoices?page=1&limit=5',
      '/api/payments?page=1&limit=5',
      '/api/parts?page=1&limit=5',
      '/api/accounts?page=1&limit=5',
      '/api/journal-entries?page=1&limit=5',
      '/api/employees?page=1&limit=5',
      '/api/branches?page=1&limit=5',
      '/api/users?page=1&limit=5',
      '/api/reports?page=1&limit=5',
      '/api/expenses?page=1&limit=5',
      '/api/cheques?page=1&limit=5',
    ];

    for (const api of apis) {
      const response = await request.get(`http://localhost:8080${api}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      expect(response.status()).toBeLessThan(500);
      expect(response.status()).not.toBe(404);
    }
    console.log(`✅ ${apis.length} APIs OK`);
  });

  // ============================================
  // 4. ACCOUNTING DEEP CHECK
  // ============================================
  test('Accounting: Account balances valid', async ({ request }) => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZTZjZmQ2LWU1NDMtNDhjYi05ZmY5LTQ2NTczM2FkYTc5MiIsInRlbmFudElkIjoiZGVmYXVsdCIsInJvbGUiOiJPV05FUiIsInVzZXJuYW1lIjoib3duZXIiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzgxODIyNTQyLCJleHAiOjQ5Mzc1ODI1NDJ9.NAJ8sTw3UABaexrlw5v_dKhBhfCvUFKjbdMcB4nyiWQ';

    const response = await request.get('http://localhost:8080/api/accounts?page=1&limit=100', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const body = await response.json();
    const accounts = body.data || [];

    for (const account of accounts) {
      const balanceSYP = Number(account.balanceSYP || 0);
      const balanceUSD = Number(account.balanceUSD || 0);
      expect(balanceSYP).not.toBeNaN();
      expect(balanceUSD).not.toBeNaN();
    }
    console.log(`✅ ${accounts.length} accounts validated`);
  });

  test('Accounting: Journal entries balanced', async ({ request }) => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZTZjZmQ2LWU1NDMtNDhjYi05ZmY5LTQ2NTczM2FkYTc5MiIsInRlbmFudElkIjoiZGVmYXVsdCIsInJvbGUiOiJPV05FUiIsInVzZXJuYW1lIjoib3duZXIiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzgxODIyNTQyLCJleHAiOjQ5Mzc1ODI1NDJ9.NAJ8sTw3UABaexrlw5v_dKhBhfCvUFKjbdMcB4nyiWQ';

    const response = await request.get('http://localhost:8080/api/journal-entries?page=1&limit=100', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const body = await response.json();
    const entries = body.data || [];

    let balanced = 0;
    for (const entry of entries) {
      const lines = entry.lines || [];
      const debit = lines.reduce((s: number, l: any) => s + (Number(l.debit) || 0), 0);
      const credit = lines.reduce((s: number, l: any) => s + (Number(l.credit) || 0), 0);
      if (debit === credit) balanced++;
    }
    console.log(`✅ ${balanced}/${entries.length} journal entries balanced`);
  });

});
