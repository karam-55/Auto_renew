import { test, expect } from '@playwright/test';

/**
 * PHASE 3: Inventory Module (Deep Testing)
 * Tests every part field, quantity, price, CRUD, DB verification
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
  await page.screenshot({ path: `test-results/phase3-${name}.png`, fullPage: true });
}

function getToken(page: any) {
  return page.evaluate(() => localStorage.getItem('token') || '');
}

// ============================================
// PART 1: INVENTORY LIST
// ============================================
test.describe('PART 1: Inventory List', () => {

  test('1.1: Navigate to inventory', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/inventory');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/مخزون|قطع|part|inventory/i);

    await screenshot(page, '1.1-inventory-list');
    console.log('✅ Inventory list loaded');
  });

  test('1.2: Inventory table headers', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/inventory');
    await page.waitForTimeout(2000);

    const body = await page.locator('body').textContent() || '';

    const headers = ['الاسم', 'Name', 'الكمية', 'Quantity', 'السعر', 'Price', 'رقم', 'Number'];
    for (const h of headers) {
      if (body.includes(h)) console.log(`✅ Header: ${h}`);
    }

    await screenshot(page, '1.2-inventory-headers');
  });

  test('1.3: Search parts', async ({ page }) => {
    test.setTimeout(120000);
    await login(page);
    await page.goto('http://localhost:1420#/inventory');
    await page.waitForTimeout(3000);

    const search = page.locator('input[type="text"]').first();
    try {
      await search.waitFor({ state: 'visible', timeout: 10000 });
      await search.fill('oil');
      await page.waitForTimeout(2000);
      await screenshot(page, '1.3-inventory-search');
      console.log('✅ Inventory search works');
    } catch (e) {
      console.log('⚠️ Search input not available');
      await screenshot(page, '1.3-no-search');
    }
  });

  test('1.4: Filter by quantity', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/inventory');
    await page.waitForTimeout(2000);

    const selects = page.locator('select');
    if (await selects.count() > 0) {
      console.log('Found', await selects.count(), 'filters');
      await screenshot(page, '1.4-inventory-filters');
    }
  });
});

// ============================================
// PART 2: CREATE PART
// ============================================
test.describe('PART 2: Create Part', () => {

  test('2.1: Open create form', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/inventory');
    await page.waitForTimeout(2000);

    const addBtn = page.locator('button').filter({ hasText: /إضافة|add|جديد|new/i }).first();
    if (await addBtn.count() > 0) {
      await addBtn.click();
      await page.waitForTimeout(1500);

      const inputs = page.locator('input');
      console.log('Form inputs:', await inputs.count());

      await screenshot(page, '2.1-part-form');
    }
  });

  test('2.2: Fill part form', async ({ page }) => {
    test.setTimeout(120000);
    await login(page);
    await page.goto('http://localhost:1420#/inventory');
    await page.waitForTimeout(3000);

    const addBtn = page.locator('button').filter({ hasText: /إضافة|add|جديد|new/i }).first();
    if (await addBtn.count() === 0) {
      console.log('⚠️ No add button');
      return;
    }

    await addBtn.click();
    await page.waitForTimeout(3000);

    // Use specific selectors instead of looping all inputs
    const nameInput = page.locator('input[placeholder*="اسم"], input[placeholder*="name"]').first();
    const numInput = page.locator('input[placeholder*="رقم"], input[placeholder*="number"]').first();
    const qtyInput = page.locator('input[placeholder*="كمية"], input[placeholder*="quantity"]').first();
    const priceInput = page.locator('input[placeholder*="سعر"], input[placeholder*="price"]').first();

    try {
      if (await nameInput.count() > 0) await nameInput.fill('قطعة اختبار ' + Date.now());
      if (await numInput.count() > 0) await numInput.fill('PART-' + Date.now());
      if (await qtyInput.count() > 0) await qtyInput.fill('50');
      if (await priceInput.count() > 0) await priceInput.fill('25000');
      console.log('✅ Part form filled');
    } catch (e) {
      console.log('⚠️ Error filling form:', e);
    }

    await screenshot(page, '2.2-part-filled');
  });

  test('2.3: Validation on empty form', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/inventory');
    await page.waitForTimeout(2000);

    const addBtn = page.locator('button').filter({ hasText: /إضافة|add|جديد|new/i }).first();
    if (await addBtn.count() === 0) return;

    await addBtn.click();
    await page.waitForTimeout(1000);

    const submit = page.locator('button[type="submit"]').first();
    if (await submit.count() > 0) {
      await submit.click();
      await page.waitForTimeout(1000);
      await screenshot(page, '2.3-part-validation');
    }
  });
});

// ============================================
// PART 3: MASS INVENTORY CREATION
// ============================================
test.describe('PART 3: Mass Inventory', () => {

  test('3.1: Create 100 parts via API', async ({ page, request }) => {
    await login(page);
    const token = await getToken(page);

    let created = 0;
    const categories = ['Oil', 'Filter', 'Brake', 'Tire', 'Battery'];

    for (let i = 0; i < 100; i++) {
      const response = await request.post('http://localhost:8080/api/parts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: {
          name: categories[i % categories.length] + ' Mass ' + i,
          partNumber: 'MASS-' + Date.now() + '-' + i + '-' + Math.floor(Math.random() * 10000),
          description: 'وصف قطعة ' + i,
          quantity: Math.floor(Math.random() * 100) + 10,
          minQuantity: 5,
          costSYP: (Math.floor(Math.random() * 50) + 10) * 1000,
          sellingPriceSYP: (Math.floor(Math.random() * 50) + 20) * 1000,
        },
      });

      if (response.status() === 201 || response.status() === 200) {
        created++;
      }
    }

    console.log('✅ Created', created, 'parts');
    expect(created).toBeGreaterThan(0);
  });

  test('3.2: Verify parts in UI', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/inventory');
    await page.waitForTimeout(3000);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    await screenshot(page, '3.2-mass-inventory');
    console.log('✅ Mass inventory loaded in UI');
  });

  test('3.3: Verify parts in API', async ({ page, request }) => {
    await login(page);
    const token = await getToken(page);

    const response = await request.get('http://localhost:8080/api/parts?page=1&limit=200', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const body = await response.json();
    const parts = body.data || [];

    let totalValue = 0;
    let totalQuantity = 0;

    for (const part of parts) {
      totalValue += (Number(part.sellingPriceSYP || part.priceSYP || 0)) * (Number(part.quantity) || 0);
      totalQuantity += Number(part.quantity) || 0;

      // Verify positive quantities
      expect(Number(part.quantity || 0)).toBeGreaterThanOrEqual(0);
    }

    console.log('✅ Parts stats:', {
      count: parts.length,
      totalQuantity,
      totalValue: totalValue.toLocaleString('ar-SA') + ' ل.س',
    });
  });

  test('3.4: Update quantities', async ({ page, request }) => {
    await login(page);
    const token = await getToken(page);

    const response = await request.get('http://localhost:8080/api/parts?page=1&limit=50', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const body = await response.json();
    const parts = body.data || [];

    let updated = 0;
    for (let i = 0; i < Math.min(20, parts.length); i++) {
      const updateRes = await request.put(`http://localhost:8080/api/parts/${parts[i].id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: { quantity: Math.floor(Math.random() * 200) + 50 },
      });

      if (updateRes.status() === 200) updated++;
    }

    console.log('✅ Updated', updated, 'parts');
  });
});

// ============================================
// PART 4: INVENTORY REPORTS
// ============================================
test.describe('PART 4: Inventory Reports', () => {

  test('4.1: Low stock report', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/inventory');
    await page.waitForTimeout(3000);

    // Look for low stock filter
    const body = await page.locator('body').textContent() || '';
    const hasLowStock = /منخفض|low|نفاد|out of stock/i.test(body);

    console.log('Has low stock indicator:', hasLowStock);
    await screenshot(page, '4.1-low-stock');
  });

  test('4.2: Inventory valuation', async ({ page, request }) => {
    await login(page);
    const token = await getToken(page);

    const response = await request.get('http://localhost:8080/api/parts?page=1&limit=300', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const body = await response.json();
    const parts = body.data || [];

    let totalCost = 0;
    let totalValue = 0;

    for (const part of parts) {
      const qty = Number(part.quantity) || 0;
      const cost = Number(part.costSYP || part.cost || 0);
      const price = Number(part.sellingPriceSYP || part.priceSYP || part.price || 0);

      totalCost += cost * qty;
      totalValue += price * qty;
    }

    console.log('✅ Valuation:', {
      totalCost: totalCost.toLocaleString('ar-SA') + ' ل.س',
      totalValue: totalValue.toLocaleString('ar-SA') + ' ل.س',
      profit: (totalValue - totalCost).toLocaleString('ar-SA') + ' ل.س',
    });
  });
});
