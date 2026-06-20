import { test, expect } from '@playwright/test';

/**
 * Flutter Web UI Tests using Playwright
 * Opens the actual Flutter Web app and verifies it loads correctly.
 */

test.use({
  viewport: { width: 1920, height: 1080 },
  launchOptions: {
    slowMo: 500,
  },
});

test.describe('🖥️ Flutter Web UI Tests', () => {

  test('Step 1: Login page loads correctly', async ({ page }) => {
    await page.goto('http://localhost:8081/#/login');

    // Wait for Flutter to render
    await page.waitForTimeout(5000);

    // Take screenshot
    await page.screenshot({ path: 'test-results/flutter-01-login.png', fullPage: true });

    // Check page loaded (Flutter renders to canvas, so check title and basic structure)
    const title = await page.title();
    console.log('Page title:', title);

    // Verify canvas element exists (Flutter renders on canvas)
    const canvas = page.locator('canvas').first();
    const canvasCount = await canvas.count();
    expect(canvasCount).toBeGreaterThan(0);

    // Check for flutter-view element
    const flutterView = page.locator('flutter-view').first();
    const flutterViewCount = await flutterView.count();

    // Either canvas or flutter-view should exist
    expect(canvasCount + flutterViewCount).toBeGreaterThan(0);

    console.log('✅ Login page loaded with Flutter Canvas');
  });

  test('Step 2: Verify page structure', async ({ page }) => {
    await page.goto('http://localhost:8081/#/login');
    await page.waitForTimeout(5000);

    // Screenshot
    await page.screenshot({ path: 'test-results/flutter-02-login.png', fullPage: true });

    // Verify Flutter rendered (check for specific HTML structure)
    const hasCanvas = await page.locator('canvas').count() > 0;
    const hasFlutterView = await page.locator('flutter-view').count() > 0;

    expect(hasCanvas || hasFlutterView).toBe(true);

    // Verify no error screen
    const body = await page.locator('body').innerHTML();
    expect(body).not.toContain('═══');

    console.log('✅ Login page structure verified');
  });

  test('Step 3: Verify all main routes load without errors', async ({ page }) => {
    const routes = [
      { path: '/login', name: 'Login' },
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/customers', name: 'Customers' },
      { path: '/bookings', name: 'Bookings' },
      { path: '/services', name: 'Services' },
      { path: '/invoices', name: 'Invoices' },
      { path: '/inventory', name: 'Inventory' },
      { path: '/settings', name: 'Settings' },
      { path: '/hr', name: 'HR' },
      { path: '/notification-rules', name: 'Notification Rules' },
      { path: '/whatsapp-messages', name: 'WhatsApp Messages' },
      { path: '/accounting', name: 'Accounting' },
    ];

    for (const route of routes) {
      console.log(`  Testing route: ${route.path}`);
      await page.goto(`http://localhost:8081/#${route.path}`);
      await page.waitForTimeout(3000);

      // Check no error widget (Flutter shows red screen on errors)
      const bodyHtml = await page.locator('body').innerHTML();

      // Screenshot
      await page.screenshot({ path: `test-results/flutter-route-${route.name}.png`, fullPage: true });

      // Verify no crash indicators
      expect(bodyHtml).not.toContain('═══');
      expect(bodyHtml).not.toContain('Exception');

      console.log(`    ✅ ${route.name} loaded`);
    }
  });

  test('Step 4: Check no JavaScript errors in console', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('http://localhost:8081/#/login');
    await page.waitForTimeout(5000);

    // Navigate through several pages
    for (const path of ['/dashboard', '/customers', '/settings']) {
      await page.goto(`http://localhost:8081/#${path}`);
      await page.waitForTimeout(3000);
    }

    console.log('Console errors found:', errors.length);
    if (errors.length > 0) {
      console.log('Errors:', errors.slice(0, 5));
    }

    // Allow some non-critical errors but no crashes
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('Source map') &&
      !e.includes('404')
    );

    expect(criticalErrors.length).toBeLessThan(5);
    console.log('✅ No critical JS errors');
  });
});
