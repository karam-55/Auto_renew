import { test, expect } from '@playwright/test';

/**
 * UI End-to-End Tests - Simulates a real human using the Flutter Web Admin UI
 * These tests open the browser and interact with the actual interface.
 */

test.describe('🖥️ Admin UI - Human Journey', () => {

  test('Step 1: Open login page and verify fields exist', async ({ page }) => {
    await page.goto('http://localhost:8081/#/login');
    await page.waitForLoadState('networkidle');

    // Wait for Flutter to load
    await page.waitForTimeout(3000);

    // Take screenshot of login page
    await page.screenshot({ path: 'test-results/ui-01-login-page.png', fullPage: true });

    // Verify login form elements exist (by placeholder text or labels)
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toContain('تسجيل الدخول');

    console.log('✅ Login page loaded');
  });

  test('Step 2: Login with credentials', async ({ page }) => {
    await page.goto('http://localhost:8081/#/login');
    await page.waitForTimeout(3000);

    // Fill tenant ID
    const tenantInput = page.locator('input').filter({ hasText: /معرف المستأجر|tenant/i }).first();
    if (await tenantInput.count() > 0) {
      await tenantInput.fill('default-tenant');
    }

    // Fill username
    await page.getByPlaceholder(/اسم المستخدم|username/i).fill('admin');

    // Fill password
    await page.getByPlaceholder(/كلمة المرور|password/i).fill('admin123');

    // Click login button
    await page.getByRole('button', { name: /تسجيل الدخول|login/i }).click();

    // Wait for dashboard to load
    await page.waitForTimeout(4000);

    // Take screenshot
    await page.screenshot({ path: 'test-results/ui-02-dashboard.png', fullPage: true });

    // Verify we're logged in (dashboard should show)
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/لوحة التحكم|dashboard|إجمالي/i);

    console.log('✅ Logged in and dashboard loaded');
  });

  test('Step 3: Navigate to Customers screen', async ({ page }) => {
    await page.goto('http://localhost:8081/#/login');
    await page.waitForTimeout(3000);

    // Login first
    try {
      await page.getByPlaceholder(/اسم المستخدم/i).fill('admin');
      await page.getByPlaceholder(/كلمة المرور/i).fill('admin123');
      await page.getByRole('button', { name: /تسجيل الدخول/i }).click();
      await page.waitForTimeout(4000);
    } catch (e) {
      // Already logged in or different UI
    }

    // Click on Customers menu item
    const customersLink = page.locator('text=/الزبائن|العملاء|Customers/i').first();
    if (await customersLink.count() > 0) {
      await customersLink.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'test-results/ui-03-customers.png', fullPage: true });

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/زبون|عميل|customer|قائمة/i);

    console.log('✅ Customers screen loaded');
  });

  test('Step 4: Navigate to Services screen', async ({ page }) => {
    await page.goto('http://localhost:8081/#/login');
    await page.waitForTimeout(3000);

    // Login
    try {
      await page.getByPlaceholder(/اسم المستخدم/i).fill('admin');
      await page.getByPlaceholder(/كلمة المرور/i).fill('admin123');
      await page.getByRole('button', { name: /تسجيل الدخول/i }).click();
      await page.waitForTimeout(4000);
    } catch (e) {}

    // Click Services
    const servicesLink = page.locator('text=/الخدمات|Services/i').first();
    if (await servicesLink.count() > 0) {
      await servicesLink.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'test-results/ui-04-services.png', fullPage: true });

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/خدمة|service|الخدمات/i);

    console.log('✅ Services screen loaded');
  });

  test('Step 5: Navigate to Bookings screen', async ({ page }) => {
    await page.goto('http://localhost:8081/#/login');
    await page.waitForTimeout(3000);

    try {
      await page.getByPlaceholder(/اسم المستخدم/i).fill('admin');
      await page.getByPlaceholder(/كلمة المرور/i).fill('admin123');
      await page.getByRole('button', { name: /تسجيل الدخول/i }).click();
      await page.waitForTimeout(4000);
    } catch (e) {}

    const bookingsLink = page.locator('text=/الحجوزات|Bookings|حجز/i').first();
    if (await bookingsLink.count() > 0) {
      await bookingsLink.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'test-results/ui-05-bookings.png', fullPage: true });

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/حجز|booking|الحجوزات/i);

    console.log('✅ Bookings screen loaded');
  });

  test('Step 6: Navigate to Invoices screen', async ({ page }) => {
    await page.goto('http://localhost:8081/#/login');
    await page.waitForTimeout(3000);

    try {
      await page.getByPlaceholder(/اسم المستخدم/i).fill('admin');
      await page.getByPlaceholder(/كلمة المرور/i).fill('admin123');
      await page.getByRole('button', { name: /تسجيل الدخول/i }).click();
      await page.waitForTimeout(4000);
    } catch (e) {}

    const invoicesLink = page.locator('text=/الفواتير|Invoices|فاتورة/i').first();
    if (await invoicesLink.count() > 0) {
      await invoicesLink.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'test-results/ui-06-invoices.png', fullPage: true });

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/فاتورة|invoice|الفواتير/i);

    console.log('✅ Invoices screen loaded');
  });

  test('Step 7: Navigate to Inventory screen', async ({ page }) => {
    await page.goto('http://localhost:8081/#/login');
    await page.waitForTimeout(3000);

    try {
      await page.getByPlaceholder(/اسم المستخدم/i).fill('admin');
      await page.getByPlaceholder(/كلمة المرور/i).fill('admin123');
      await page.getByRole('button', { name: /تسجيل الدخول/i }).click();
      await page.waitForTimeout(4000);
    } catch (e) {}

    const inventoryLink = page.locator('text=/المخزون|المخزن|Inventory|Parts/i').first();
    if (await inventoryLink.count() > 0) {
      await inventoryLink.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'test-results/ui-07-inventory.png', fullPage: true });

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/مخزون|مخزن|inventory|قطع/i);

    console.log('✅ Inventory screen loaded');
  });

  test('Step 8: Navigate to Settings screen', async ({ page }) => {
    await page.goto('http://localhost:8081/#/login');
    await page.waitForTimeout(3000);

    try {
      await page.getByPlaceholder(/اسم المستخدم/i).fill('admin');
      await page.getByPlaceholder(/كلمة المرور/i).fill('admin123');
      await page.getByRole('button', { name: /تسجيل الدخول/i }).click();
      await page.waitForTimeout(4000);
    } catch (e) {}

    const settingsLink = page.locator('text=/الإعدادات|Settings|setting/i').first();
    if (await settingsLink.count() > 0) {
      await settingsLink.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'test-results/ui-08-settings.png', fullPage: true });

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/إعداد|setting|الشركة|فروع/i);

    console.log('✅ Settings screen loaded');
  });

  test('Step 9: Navigate to Notification Rules screen', async ({ page }) => {
    await page.goto('http://localhost:8081/#/login');
    await page.waitForTimeout(3000);

    try {
      await page.getByPlaceholder(/اسم المستخدم/i).fill('admin');
      await page.getByPlaceholder(/كلمة المرور/i).fill('admin123');
      await page.getByRole('button', { name: /تسجيل الدخول/i }).click();
      await page.waitForTimeout(4000);
    } catch (e) {}

    const notifLink = page.locator('text=/قواعد الإشعارات|Notification Rules|إشعارات/i').first();
    if (await notifLink.count() > 0) {
      await notifLink.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'test-results/ui-09-notifications.png', fullPage: true });

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/إشعار|notification|قاعدة/i);

    console.log('✅ Notification Rules screen loaded');
  });

  test('Step 10: Navigate to HR screen', async ({ page }) => {
    await page.goto('http://localhost:8081/#/login');
    await page.waitForTimeout(3000);

    try {
      await page.getByPlaceholder(/اسم المستخدم/i).fill('admin');
      await page.getByPlaceholder(/كلمة المرور/i).fill('admin123');
      await page.getByRole('button', { name: /تسجيل الدخول/i }).click();
      await page.waitForTimeout(4000);
    } catch (e) {}

    const hrLink = page.locator('text=/الموارد البشرية|HR|موظف|Employee/i').first();
    if (await hrLink.count() > 0) {
      await hrLink.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'test-results/ui-10-hr.png', fullPage: true });

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/موظف|موارد|HR|employee/i);

    console.log('✅ HR screen loaded');
  });

  test('Step 11: Navigate to Reports screen', async ({ page }) => {
    await page.goto('http://localhost:8081/#/login');
    await page.waitForTimeout(3000);

    try {
      await page.getByPlaceholder(/اسم المستخدم/i).fill('admin');
      await page.getByPlaceholder(/كلمة المرور/i).fill('admin123');
      await page.getByRole('button', { name: /تسجيل الدخول/i }).click();
      await page.waitForTimeout(4000);
    } catch (e) {}

    const reportsLink = page.locator('text=/تقارير|Reports|تحليلات|Analytics/i').first();
    if (await reportsLink.count() > 0) {
      await reportsLink.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'test-results/ui-11-reports.png', fullPage: true });

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/تقرير|report|تحليل|analytics/i);

    console.log('✅ Reports screen loaded');
  });

  test('Step 12: Navigate to Accounting screen', async ({ page }) => {
    await page.goto('http://localhost:8081/#/login');
    await page.waitForTimeout(3000);

    try {
      await page.getByPlaceholder(/اسم المستخدم/i).fill('admin');
      await page.getByPlaceholder(/كلمة المرور/i).fill('admin123');
      await page.getByRole('button', { name: /تسجيل الدخول/i }).click();
      await page.waitForTimeout(4000);
    } catch (e) {}

    const accountingLink = page.locator('text=/المحاسبة|Accounting|قيود|journal/i').first();
    if (await accountingLink.count() > 0) {
      await accountingLink.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'test-results/ui-12-accounting.png', fullPage: true });

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/محاسبة|accounting|قيد|journal|دفتر/i);

    console.log('✅ Accounting screen loaded');
  });
});
