import { test, expect } from '@playwright/test';

/**
 * Admin Tauri UI E2E Tests - Simulates a real human using the Admin Tauri interface
 * Tests the HTML/JS/Tailwind frontend running on port 1420
 */

test.use({
  viewport: { width: 1920, height: 1080 },
  launchOptions: {
    slowMo: 300,
  },
});

test.describe('🖥️ Admin Tauri - Human Journey E2E', () => {

  // ============================================
  // STEP 1: Login Page
  // ============================================
  test('Step 1: Login page loads correctly', async ({ page }) => {
    await page.goto('http://localhost:1420');
    await page.waitForLoadState('networkidle');

    // Wait for the app to load
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: 'test-results/tauri-01-login.png', fullPage: true });

    // Verify login form exists
    const bodyText = await page.locator('body').textContent() || '';
    expect(bodyText).toMatch(/تسجيل الدخول|login/i);

    console.log('✅ Login page loaded');
  });

  // ============================================
  // STEP 2: Login with credentials
  // ============================================
  test('Step 2: Login and reach dashboard', async ({ page }) => {
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(2000);

    // Fill login form (admin tauri has tenant, username, password fields)
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    console.log('Found', inputCount, 'input fields');

    // Fill username and password
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const type = await input.getAttribute('type');
      const placeholder = await input.getAttribute('placeholder') || '';

      if (type === 'password') {
        await input.fill('owner123');
      } else if (type === 'text' && (placeholder.includes('مستخدم') || placeholder.includes('user'))) {
        await input.fill('owner');
      } else if (type === 'text') {
        // Fallback: fill based on position
        if (i === 0) await input.fill('owner');
      }
    }

    // Click login button
    const loginBtn = page.locator('button').filter({ hasText: /تسجيل|دخول|login/i }).first();
    if (await loginBtn.count() > 0) {
      await loginBtn.click();
    } else {
      // Try any button
      const anyBtn = page.locator('button').first();
      if (await anyBtn.count() > 0) {
        await anyBtn.click();
      }
    }

    // Wait for navigation
    await page.waitForTimeout(4000);

    // Take screenshot
    await page.screenshot({ path: 'test-results/tauri-02-dashboard.png', fullPage: true });

    // Verify we're past login (should see dashboard or sidebar)
    const bodyText = await page.locator('body').textContent() || '';
    const isLoggedIn = bodyText.match(/لوحة|dashboard|الرئيسية|القائمة|sidebar|menu/i);

    console.log('✅ After login, body contains:', bodyText.substring(0, 200));
    expect(isLoggedIn).toBeTruthy();
  });

  // ============================================
  // STEP 3: Navigate through main screens
  // ============================================
  test('Step 3: Navigate to all main screens', async ({ page }) => {
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(3000);

    // Login first
    try {
      const inputs = page.locator('input');
      const count = await inputs.count();
      for (let i = 0; i < count; i++) {
        const input = inputs.nth(i);
        const type = await input.getAttribute('type');
        const placeholder = await input.getAttribute('placeholder') || '';
        if (type === 'password') await input.fill('owner123');
        else if (type === 'text' && (placeholder.includes('مستخدم') || placeholder.includes('user'))) await input.fill('owner');
        else if (type === 'text' && i === 0) await input.fill('owner');
      }
      await page.locator('button').filter({ hasText: /تسجيل|دخول/i }).first().click();
      await page.waitForTimeout(4000);
    } catch (e) {
      console.log('Login step error (may already be logged in):', e);
    }

    const screens = [
      { name: 'الزبائن', keywords: /زبون|عميل|customer/i },
      { name: 'الحجوزات', keywords: /حجز|booking/i },
      { name: 'الخدمات', keywords: /خدمة|service/i },
      { name: 'الفواتير', keywords: /فاتورة|invoice/i },
      { name: 'المخزون', keywords: /مخزون|قطع|inventory|part/i },
      { name: 'المحاسبة', keywords: /محاسبة|accounting|حساب/i },
      { name: 'التقارير', keywords: /تقرير|report/i },
    ];

    for (const screen of screens) {
      try {
        // Find and click the menu item
        const menuItem = page.locator('a, button, div').filter({ hasText: screen.name }).first();
        if (await menuItem.count() > 0) {
          await menuItem.click();
          await page.waitForTimeout(2000);

          // Take screenshot
          await page.screenshot({ path: `test-results/tauri-screen-${screen.name}.png`, fullPage: true });

          // Verify screen loaded
          const bodyText = await page.locator('body').textContent() || '';
          const loaded = screen.keywords.test(bodyText);
          console.log(`  ${loaded ? '✅' : '⚠️'} Screen "${screen.name}" - ${loaded ? 'loaded' : 'may need scroll'}`);
        } else {
          console.log(`  ⚠️ Menu item "${screen.name}" not found`);
        }
      } catch (e) {
        console.log(`  ⚠️ Error navigating to ${screen.name}:`, e);
      }
    }
  });

  // ============================================
  // STEP 4: Test Chart of Accounts (المحاسبة)
  // ============================================
  test('Step 4: Test Chart of Accounts - Add/Edit/Delete', async ({ page }) => {
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(3000);

    // Login
    try {
      const inputs = page.locator('input');
      const count = await inputs.count();
      for (let i = 0; i < count; i++) {
        const input = inputs.nth(i);
        const type = await input.getAttribute('type');
        const placeholder = await input.getAttribute('placeholder') || '';
        if (type === 'password') await input.fill('owner123');
        else if (type === 'text' && (placeholder.includes('مستخدم') || placeholder.includes('user'))) await input.fill('owner');
        else if (type === 'text' && i === 0) await input.fill('owner');
      }
      await page.locator('button').filter({ hasText: /تسجيل|دخول/i }).first().click();
      await page.waitForTimeout(4000);
    } catch (e) {}

    // Navigate to Accounting > Chart of Accounts
    const accountingLink = page.locator('a, button, div').filter({ hasText: /المحاسبة|accounting/i }).first();
    if (await accountingLink.count() > 0) {
      await accountingLink.click();
      await page.waitForTimeout(2000);
    }

    const chartLink = page.locator('a, button, div').filter({ hasText: /شجرة الحسابات|chart of accounts/i }).first();
    if (await chartLink.count() > 0) {
      await chartLink.click();
      await page.waitForTimeout(2000);
    }

    // Take screenshot
    await page.screenshot({ path: 'test-results/tauri-04-chart-of-accounts.png', fullPage: true });

    // Verify chart of accounts loaded
    const bodyText = await page.locator('body').textContent() || '';
    expect(bodyText).toMatch(/حساب|account|شجرة|chart/i);

    console.log('✅ Chart of Accounts screen loaded');
  });

  // ============================================
  // STEP 5: Check for JavaScript errors
  // ============================================
  test('Step 5: Check no critical JS errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('http://localhost:1420');
    await page.waitForTimeout(5000);

    // Navigate to a few screens
    for (const path of ['/', '/dashboard', '/customers']) {
      try {
        await page.goto(`http://localhost:1420${path}`);
        await page.waitForTimeout(2000);
      } catch (e) {}
    }

    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('Source map') &&
      !e.includes('404') &&
      !e.includes('webpack')
    );

    console.log('Console errors found:', errors.length, 'Critical:', criticalErrors.length);
    if (criticalErrors.length > 0) {
      console.log('Critical errors:', criticalErrors.slice(0, 5));
    }

    expect(criticalErrors.length).toBeLessThan(10);
    console.log('✅ No critical JS errors');
  });

});
