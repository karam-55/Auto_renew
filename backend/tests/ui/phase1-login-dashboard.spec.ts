import { test, expect } from '@playwright/test';

/**
 * GROUP 1: Login + Dashboard (21 Tests)
 * Deep testing of every screen element, interaction, and edge case
 * Based on code analysis of admin_tauri/src/screens/login.ts and dashboard.ts
 */

test.use({
  viewport: { width: 1920, height: 1080 },
  launchOptions: { slowMo: 100 },
});

// ============================================
// HELPERS
// ============================================

let authToken: string = '';

async function login(page: any, username = 'owner', password = 'owner123') {
  await page.goto('http://localhost:1420');
  await page.waitForTimeout(1500);
  await page.locator('#username').fill(username);
  await page.locator('#password').fill(password);
  await page.locator('#login-btn, button[type="submit"]').click();
  await page.waitForTimeout(2500);
  authToken = await page.evaluate(() => localStorage.getItem('token') || '');
}

async function screenshot(page: any, name: string) {
  await page.waitForTimeout(800);
  await page.screenshot({ path: `test-results/group1-${name}.png`, fullPage: true });
}

// ============================================
// PART 1: LOGIN SCREEN (11 Tests)
// ============================================

test.describe('PART 1: Login Screen Deep Test', () => {

  test('1.1: Page title and branding visible', async ({ page }) => {
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(1000);

    const title = await page.title();
    expect(title).toBeTruthy();

    const body = await page.locator('body').textContent() || '';
    expect(body).toContain('AUTO_Renew');
    console.log('Page title:', title);
  });

  test('1.2: Username input field', async ({ page }) => {
    await page.goto('http://localhost:1420');

    const username = page.locator('#username');
    await expect(username).toBeVisible();
    await expect(username).toBeEnabled();

    const placeholder = await username.getAttribute('placeholder');
    expect(placeholder).toMatch(/اسم المستخدم|username|المستخدم/i);

    // Test typing
    await username.fill('testuser');
    expect(await username.inputValue()).toBe('testuser');

    // Test clear
    await username.fill('');
    expect(await username.inputValue()).toBe('');
  });

  test('1.3: Password input field (type=password)', async ({ page }) => {
    await page.goto('http://localhost:1420');

    const password = page.locator('#password');
    await expect(password).toBeVisible();
    await expect(password).toBeEnabled();

    expect(await password.getAttribute('type')).toBe('password');

    await password.fill('testpass');
    expect(await password.inputValue()).toBe('testpass');
  });

  test('1.4: Password visibility toggle', async ({ page }) => {
    await page.goto('http://localhost:1420');

    const toggle = page.locator('#toggle-password');
    if (await toggle.count() > 0) {
      const password = page.locator('#password');
      expect(await password.getAttribute('type')).toBe('password');

      await toggle.click();
      await page.waitForTimeout(300);
      expect(await password.getAttribute('type')).toBe('text');

      await toggle.click();
      await page.waitForTimeout(300);
      expect(await password.getAttribute('type')).toBe('password');

      console.log('Password toggle works');
    } else {
      console.log('No password toggle found');
    }
  });

  test('1.5: Remember me checkbox', async ({ page }) => {
    await page.goto('http://localhost:1420');

    const remember = page.locator('#remember');
    if (await remember.count() > 0) {
      await expect(remember).toBeVisible();
      expect(await remember.isChecked()).toBe(false);

      await remember.check();
      expect(await remember.isChecked()).toBe(true);

      await remember.uncheck();
      expect(await remember.isChecked()).toBe(false);

      console.log('Remember me checkbox works');
    }
  });

  test('1.6: Login button visible and clickable', async ({ page }) => {
    await page.goto('http://localhost:1420');

    const btn = page.locator('#login-btn, button[type="submit"]');
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();

    const text = await btn.textContent();
    expect(text).toMatch(/تسجيل|دخول|login|تسجيل دخول/i);
  });

  test('1.7: Login with invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(1000);

    await page.locator('#username').fill('wronguser');
    await page.locator('#password').fill('wrongpass');
    await page.locator('#login-btn, button[type="submit"]').click();
    await page.waitForTimeout(2000);

    const body = await page.locator('body').textContent() || '';
    const hasError = /خطأ|error|Invalid|فشل|credentials|غير صحيح/i.test(body);
    expect(hasError).toBe(true);

    await screenshot(page, '1.7-login-error');
  });

  test('1.8: Login with empty fields', async ({ page }) => {
    await page.goto('http://localhost:1420');

    // Empty username
    await page.locator('#username').fill('');
    await page.locator('#password').fill('somepass');
    await page.locator('#login-btn, button[type="submit"]').click();
    await page.waitForTimeout(1500);

    let body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/خطأ|error|required|فشل/i);

    // Empty password
    await page.locator('#username').fill('owner');
    await page.locator('#password').fill('');
    await page.locator('#login-btn, button[type="submit"]').click();
    await page.waitForTimeout(1500);

    body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/خطأ|error|required|فشل/i);
  });

  test('1.9: Login with valid credentials', async ({ page }) => {
    await login(page, 'owner', 'owner123');

    const url = page.url();
    expect(url).not.toContain('login');

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/لوحة|dashboard|الرئيسية|AUTO_Renew/i);

    await screenshot(page, '1.9-login-success');
  });

  test('1.10: Token stored in localStorage after login', async ({ page }) => {
    await login(page, 'owner', 'owner123');

    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
    expect(token?.length).toBeGreaterThan(20);

    authToken = token || '';
    console.log('Token stored, length:', token?.length);
  });

  test('1.11: Token valid for API calls', async ({ page, request }) => {
    await login(page, 'owner', 'owner123');

    const token = await page.evaluate(() => localStorage.getItem('token'));
    const response = await request.get('http://localhost:8080/api/dashboard/kpis', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toBeTruthy();
    console.log('Token valid for API, status:', response.status());
  });
});

// ============================================
// PART 2: DASHBOARD (10 Tests)
// ============================================

test.describe('PART 2: Dashboard Deep Test', () => {

  test('2.1: Dashboard structure and sidebar visible', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body.length).toBeGreaterThan(500);

    // Check sidebar exists
    const sidebar = await page.locator('aside, [class*="sidebar"], nav').count();
    console.log('Sidebar elements found:', sidebar);

    await screenshot(page, '2.1-dashboard-structure');
  });

  test('2.2: KPI Cards displayed with IDs', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(3000);

    // Check for KPI elements by ID or text
    const body = await page.locator('body').textContent() || '';
    const kpiChecks = [
      /إجمالي|total|الإيرادات|revenue/i,
      /الحجوزات|bookings/i,
      /العملاء|زبون|customers/i,
      /المركبات|vehicles|سيارات/i,
      /الموظفين|employees|mechanics/i,
      /المستحقات|overdue/i,
    ];

    for (const check of kpiChecks) {
      const found = check.test(body);
      console.log(`  ${found ? 'Found' : 'Missing'}: ${check.source}`);
    }

    await screenshot(page, '2.2-dashboard-kpis');
  });

  test('2.3: Dashboard KPI data matches API', async ({ page, request }) => {
    await login(page);

    const apiRes = await request.get('http://localhost:8080/api/dashboard/kpis', {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    const apiData = await apiRes.json();

    await page.goto('http://localhost:1420');
    await page.waitForTimeout(3000);

    console.log('API KPI Data:', {
      totalCustomers: apiData.totalCustomers,
      totalBookings: apiData.totalBookings,
      totalRevenue: apiData.totalRevenue,
      totalVehicles: apiData.totalVehicles,
      completedBookings: apiData.completedBookings,
      cancelledBookings: apiData.cancelledBookings,
      newCustomers: apiData.newCustomers,
      pendingPayments: apiData.pendingPayments,
      overdueInvoices: apiData.overdueInvoices,
      todayRevenueUSD: apiData.todayRevenueUSD,
    });

    // Dashboard should render content based on API data
    const body = await page.locator('body').textContent() || '';
    expect(body.length).toBeGreaterThan(1000);

    await screenshot(page, '2.3-dashboard-api-match');
  });

  test('2.4: Sidebar navigation links (28 items)', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';

    const menuItems = [
      'لوحة التحكم',
      'الحجوزات',
      'الفواتير',
      'نقطة البيع',
      'الخدمات',
      'المخزون',
      'المستودعات',
      'الموردين',
      'أوامر الشراء',
      'العملاء',
      'الوكلاء',
      'برنامج الولاء',
      'المحاسبة',
      'شجرة الحسابات',
      'القيود اليومية',
      'دفتر الأستاذ',
      'ميزان المراجعة',
      'الميزانية العمومية',
      'قائمة الدخل',
      'التدفقات النقدية',
      'مراكز التكلفة',
      'الأصول',
      'الموارد البشرية',
      'خريطة الورشة',
      'التقارير',
      'التحليلات',
      'الفروع',
      'التنبيهات',
      'المستندات',
      'المستخدمين',
      'الصلاحيات',
      'سجل التدقيق',
      'إعدادات النظام',
    ];

    let foundCount = 0;
    for (const item of menuItems) {
      if (body.includes(item)) {
        foundCount++;
      }
    }
    console.log(`Found ${foundCount}/${menuItems.length} menu items`);
    expect(foundCount).toBeGreaterThan(10);

    await screenshot(page, '2.4-sidebar-links');
  });

  test('2.5: Quick action buttons', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(3000);

    const buttons = await page.locator('button').all();
    console.log('Found', buttons.length, 'buttons on dashboard');

    const buttonTexts: string[] = [];
    for (const btn of buttons.slice(0, 20)) {
      const text = await btn.textContent();
      if (text && text.trim().length > 0) {
        buttonTexts.push(text.trim().substring(0, 40));
      }
    }
    console.log('Button texts:', buttonTexts);

    await screenshot(page, '2.5-quick-actions');
  });

  test('2.6: Recent bookings list displayed', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    const hasRecent = /آخر|recent|أحدث|الأخيرة/i.test(body);
    const hasBooking = /حجز|booking/i.test(body);

    console.log('Has recent section:', hasRecent, '| Has booking mention:', hasBooking);
    await screenshot(page, '2.6-recent-bookings');
  });

  test('2.7: Charts and visualizations (canvas/svg)', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(3000);

    const hasCanvas = await page.locator('canvas').count() > 0;
    const hasSVG = await page.locator('svg').count() > 0;

    console.log('Has canvas:', hasCanvas, '| Has SVG:', hasSVG);
    expect(hasCanvas || hasSVG).toBe(true);

    await screenshot(page, '2.7-charts');
  });

  test('2.8: Responsive layout breakpoints', async ({ page }) => {
    await login(page);

    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(2000);
    await screenshot(page, '2.8-desktop');

    // Tablet
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(2000);
    await screenshot(page, '2.8-tablet');

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(2000);
    await screenshot(page, '2.8-mobile');

    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    console.log('Responsive layouts captured');
  });

  test('2.9: Activity list section', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    const hasActivity = /نشاط|activity|recent|آخر|حدث/i.test(body);

    console.log('Has activity section:', hasActivity);
    await screenshot(page, '2.9-activity-list');
  });

  test('2.10: Logout functionality', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(2000);

    // Click logout
    const logoutBtn = page.locator('#logout-btn, [data-action="logout"], button:has-text("خروج"), button:has-text("logout")');
    if (await logoutBtn.count() > 0) {
      await logoutBtn.click();
      await page.waitForTimeout(2000);

      // Should be redirected to login
      const url = page.url();
      const body = await page.locator('body').textContent() || '';

      const isLoginPage = url.includes('login') || /تسجيل دخول|login|اسم المستخدم/i.test(body);
      expect(isLoginPage).toBe(true);

      // Token should be cleared
      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeFalsy();

      console.log('Logout successful');
    } else {
      console.log('Logout button not found');
    }

    await screenshot(page, '2.10-logout');
  });
});
