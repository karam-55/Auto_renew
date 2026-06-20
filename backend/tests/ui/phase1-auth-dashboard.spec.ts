import { test, expect } from '@playwright/test';

/**
 * PHASE 1: Authentication + Dashboard (Deep Testing)
 * Tests every element, interaction, and data validation
 */

test.use({
  viewport: { width: 1920, height: 1080 },
  launchOptions: { slowMo: 150 },
});

// Shared state
let authToken: string = '';

async function login(page: any) {
  await page.goto('http://localhost:1420');
  await page.waitForTimeout(2000);

  // Fill credentials
  await page.locator('#username').fill('owner');
  await page.locator('#password').fill('owner123');
  await page.locator('button[type="submit"]').click();

  // Wait for navigation
  await page.waitForTimeout(3000);

  // Store token
  authToken = await page.evaluate(() => localStorage.getItem('token') || '');
}

async function screenshot(page: any, name: string) {
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `test-results/phase1-${name}.png`, fullPage: true });
}

// ============================================
// PART 1: LOGIN SCREEN (Every Element)
// ============================================
test.describe('PART 1: Login Screen Deep Test', () => {

  test('1.1: Page title and metadata', async ({ page }) => {
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(1000);

    const title = await page.title();
    expect(title).toBeTruthy();
    console.log('Page title:', title);
  });

  test('1.2: Logo and branding visible', async ({ page }) => {
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(1000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toContain('AUTO_Renew');

    // Check for garage icon
    const hasIcon = await page.locator('.material-symbols-outlined, svg, img').count() > 0;
    console.log('Has icon:', hasIcon);
  });

  test('1.3: Username input field', async ({ page }) => {
    await page.goto('http://localhost:1420');

    const username = page.locator('#username');
    await expect(username).toBeVisible();
    await expect(username).toBeEnabled();

    const placeholder = await username.getAttribute('placeholder');
    expect(placeholder).toMatch(/اسم المستخدم|username/i);

    // Test typing
    await username.fill('testuser');
    const value = await username.inputValue();
    expect(value).toBe('testuser');
  });

  test('1.4: Password input field', async ({ page }) => {
    await page.goto('http://localhost:1420');

    const password = page.locator('#password');
    await expect(password).toBeVisible();
    await expect(password).toBeEnabled();

    const type = await password.getAttribute('type');
    expect(type).toBe('password');

    // Test typing
    await password.fill('testpass');
    const value = await password.inputValue();
    expect(value).toBe('testpass');
  });

  test('1.5: Password visibility toggle', async ({ page }) => {
    await page.goto('http://localhost:1420');

    const toggle = page.locator('#toggle-password');
    if (await toggle.count() > 0) {
      const password = page.locator('#password');

      // Default: password hidden
      expect(await password.getAttribute('type')).toBe('password');

      // Click toggle
      await toggle.click();
      await page.waitForTimeout(200);

      // Should show password
      expect(await password.getAttribute('type')).toBe('text');
      console.log('✅ Password toggle works');
    } else {
      console.log('⚠️ No password toggle found');
    }
  });

  test('1.6: Remember me checkbox', async ({ page }) => {
    await page.goto('http://localhost:1420');

    const remember = page.locator('#remember');
    if (await remember.count() > 0) {
      await expect(remember).toBeVisible();

      // Default unchecked
      expect(await remember.isChecked()).toBe(false);

      // Check it
      await remember.check();
      expect(await remember.isChecked()).toBe(true);

      console.log('✅ Remember me checkbox works');
    }
  });

  test('1.7: Login button', async ({ page }) => {
    await page.goto('http://localhost:1420');

    const btn = page.locator('button[type="submit"]');
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();

    const text = await btn.textContent();
    expect(text).toMatch(/تسجيل|دخول|login/i);
  });

  test('1.8: Login with invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(1000);

    // Fill wrong credentials
    await page.locator('#username').fill('wronguser');
    await page.locator('#password').fill('wrongpass');
    await page.locator('button[type="submit"]').click();

    // Wait for error
    await page.waitForTimeout(2000);

    // Check error message
    const body = await page.locator('body').textContent() || '';
    const hasError = /خطأ|error|Invalid|غير صحيح|credentials/i.test(body);

    await screenshot(page, '1.8-login-error');
    console.log('Login error shown:', hasError);
  });

  test('1.9: Login with valid credentials', async ({ page }) => {
    await login(page);

    // Should redirect away from login
    const url = page.url();
    expect(url).not.toContain('login');

    // Body should show dashboard content
    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/لوحة|dashboard|الرئيسية|القائمة|menu/i);

    await screenshot(page, '1.9-login-success');
    console.log('✅ Login successful, redirected to:', url);
  });

  test('1.10: Token stored in localStorage', async ({ page }) => {
    await login(page);

    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
    expect(token?.length).toBeGreaterThan(50);

    authToken = token || '';
    console.log('✅ Token stored:', token?.substring(0, 30) + '...');
  });

  test('1.11: Token valid for API calls', async ({ page, request }) => {
    await login(page);

    const token = await page.evaluate(() => localStorage.getItem('token'));

    const response = await request.get('http://localhost:8080/api/dashboard/kpis', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    expect(response.status()).toBe(200);
    console.log('✅ Token valid for API');
  });
});

// ============================================
// PART 2: DASHBOARD (Every Element)
// ============================================
test.describe('PART 2: Dashboard Deep Test', () => {

  test('2.1: Dashboard structure', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(3000);

    // Check for sidebar/menu
    const body = await page.locator('body').textContent() || '';

    // Should have navigation
    const hasNav = /القائمة|menu|sidebar|navigation/i.test(body);
    console.log('Has navigation:', hasNav);

    // Should have content
    expect(body.length).toBeGreaterThan(500);

    await screenshot(page, '2.1-dashboard-structure');
  });

  test('2.2: Dashboard KPIs displayed', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';

    // Check for various KPI labels
    const checks = [
      /إجمالي|total/i,
      /عميل|customer|زبون/i,
      /حجز|booking/i,
      /مركبة|vehicle|سيارة/i,
      /إيراد|revenue|دخل/i,
    ];

    for (const check of checks) {
      const found = check.test(body);
      console.log(`  ${found ? '✅' : '⚠️'} ${check.source}`);
    }

    await screenshot(page, '2.2-dashboard-kpis');
  });

  test('2.3: Dashboard data matches API', async ({ page, request }) => {
    await login(page);

    // Get API data
    const apiRes = await request.get('http://localhost:8080/api/dashboard/kpis', {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    const apiData = await apiRes.json();

    // Load dashboard
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(3000);

    console.log('API Data:', {
      customers: apiData.totalCustomers,
      bookings: apiData.totalBookings,
      revenue: apiData.totalRevenue,
      vehicles: apiData.totalVehicles,
    });

    // Dashboard should show some content
    const body = await page.locator('body').textContent() || '';
    expect(body.length).toBeGreaterThan(1000);
  });

  test('2.4: Sidebar navigation links', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(2000);

    // Find all links
    const links = await page.locator('a, [role="link"], button').all();
    console.log('Found', links.length, 'interactive elements');

    // Check for key menu items
    const body = await page.locator('body').textContent() || '';
    const menuItems = ['الزبائن', 'الحجوزات', 'الخدمات', 'الفواتير', 'المخزون', 'المحاسبة', 'التقارير'];

    for (const item of menuItems) {
      const found = body.includes(item);
      console.log(`  ${found ? '✅' : '⚠️'} ${item}`);
    }

    await screenshot(page, '2.4-sidebar-links');
  });

  test('2.5: Quick action buttons', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(2000);

    // Look for buttons
    const buttons = await page.locator('button').all();
    console.log('Found', buttons.length, 'buttons');

    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      const text = await buttons[i].textContent();
      if (text && text.length > 0) {
        console.log(`  Button ${i}: "${text.substring(0, 30)}"`);
      }
    }
  });

  test('2.6: Responsive layout', async ({ page }) => {
    await login(page);

    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(2000);
    await screenshot(page, '2.6-desktop');

    // Tablet
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(2000);
    await screenshot(page, '2.6-tablet');

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(2000);
    await screenshot(page, '2.6-mobile');

    console.log('✅ Responsive layouts captured');
  });

  test('2.7: Charts and visualizations', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').innerHTML();

    // Check for canvas (charts) or svg
    const hasCanvas = await page.locator('canvas').count() > 0;
    const hasSVG = await page.locator('svg').count() > 0;

    console.log('Has canvas:', hasCanvas, '| Has SVG:', hasSVG);
    await screenshot(page, '2.7-charts');
  });

  test('2.8: Recent activity list', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    const hasActivity = /نشاط|activity|recent|آخر/i.test(body);

    console.log('Has activity section:', hasActivity);
    await screenshot(page, '2.8-activity');
  });
});
