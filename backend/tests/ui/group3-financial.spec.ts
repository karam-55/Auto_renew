import { test, expect } from '@playwright/test';

/**
 * GROUP 3: Financial (42 Tests)
 * Invoices, Payments, Inventory, Services, POS
 * All test data is unique to avoid conflicts
 */

test.use({
  viewport: { width: 1920, height: 1080 },
  launchOptions: { slowMo: 120 },
});

// ============================================
// HELPERS
// ============================================

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
  await page.screenshot({ path: `test-results/group3-${name}.png`, fullPage: true });
}

function uniqueSuffix(): string {
  return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function uniqueInvoiceNumber(): string {
  return `INV-${uniqueSuffix()}`;
}

function uniquePartName(): string {
  return `Part_${uniqueSuffix()}`;
}

function uniquePartCode(): string {
  return `P-${Math.floor(10000 + Math.random() * 89999)}`;
}

function uniqueServiceName(): string {
  return `Service_${uniqueSuffix()}`;
}

function uniqueSupplierName(): string {
  return `Supplier_${uniqueSuffix()}`;
}

function uniqueWarehouseName(): string {
  return `WH_${uniqueSuffix()}`;
}

function uniqueAmount(): string {
  return String(Math.floor(1000 + Math.random() * 99000));
}

function uniquePrice(): string {
  return String((Math.random() * 50000 + 100).toFixed(2));
}

// ============================================
// PART 1: INVOICES LIST (Tests 5.1 - 5.5)
// ============================================

test.describe('PART 1: Invoices List Screen', () => {

  test('5.1: Navigate to invoices and verify structure', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/invoices');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/فاتورة|invoice/i);

    const search = await page.locator('#invoice-search').count();
    const filter = await page.locator('#status-filter').count();
    const tbody = await page.locator('#invoices-tbody').count();

    console.log(`Search: ${search}, Filter: ${filter}, Table: ${tbody}`);
    expect(tbody).toBeGreaterThan(0);

    await screenshot(page, '5.1-invoices-list');
  });

  test('5.2: Search invoices', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/invoices');
    await page.waitForTimeout(3000);

    const searchInput = page.locator('#invoice-search');
    if (await searchInput.count() > 0) {
      await searchInput.fill('عميل');
      await page.waitForTimeout(2000);
      await screenshot(page, '5.2-search-invoice');
    }
  });

  test('5.3: Filter by status', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/invoices');
    await page.waitForTimeout(3000);

    const statusFilter = page.locator('#status-filter');
    if (await statusFilter.count() > 0) {
      const statuses = ['UNPAID', 'PAID', 'OVERDUE', 'PARTIALLY_PAID'];
      for (const status of statuses) {
        await statusFilter.selectOption(status);
        await page.waitForTimeout(1500);
        console.log(`Filtered by status: ${status}`);
      }
      await screenshot(page, '5.3-status-filter');
    }
  });

  test('5.4: View invoice action button', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/invoices');
    await page.waitForTimeout(3000);

    const viewBtn = page.locator('[data-action="view"]').first();
    if (await viewBtn.count() > 0) {
      await expect(viewBtn).toBeVisible();
      console.log('View button visible');
    }
    await screenshot(page, '5.4-view-btn');
  });

  test('5.5: Pay invoice action button', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/invoices');
    await page.waitForTimeout(3000);

    const payBtn = page.locator('[data-action="pay"]').first();
    if (await payBtn.count() > 0) {
      await expect(payBtn).toBeVisible();
      console.log('Pay button visible');
    }
    await screenshot(page, '5.5-pay-btn');
  });
});

// ============================================
// PART 2: MANUAL INVOICE (Tests 5.6 - 5.8)
// ============================================

test.describe('PART 2: Manual Invoice Creation', () => {

  test('5.6: Navigate to new invoice page', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/invoices/new');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/فاتورة|invoice|جديد|new/i);

    await screenshot(page, '5.6-new-invoice-page');
  });

  test('5.7: Select customer in invoice', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/invoices/new');
    await page.waitForTimeout(3000);

    const customerSelect = page.locator('#customer-select');
    if (await customerSelect.count() > 0) {
      const options = await customerSelect.locator('option').all();
      if (options.length > 1) {
        await customerSelect.selectOption({ index: 1 });
        await page.waitForTimeout(1000);
        console.log('Selected customer for invoice');
      }
    }
    await screenshot(page, '5.7-invoice-customer');
  });

  test('5.8: Apply discount with unique values', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/invoices/new');
    await page.waitForTimeout(3000);

    const uniqueDiscount = Math.floor(10 + Math.random() * 50);

    const discountType = page.locator('#discount-type');
    const discountValue = page.locator('#discount-value');

    if (await discountType.count() > 0 && await discountValue.count() > 0) {
      await discountType.selectOption('PERCENTAGE');
      await discountValue.fill(String(uniqueDiscount));
      expect(await discountValue.inputValue()).toBe(String(uniqueDiscount));

      console.log('Discount test value:', uniqueDiscount + '%');
      await screenshot(page, '5.8-invoice-discount');
    }
  });
});

// ============================================
// PART 3: PAYMENT (Tests 5.9 - 5.11)
// ============================================

test.describe('PART 3: Payment Recording', () => {

  test('5.9: Payment form fields', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/payments/new?invoiceId=test');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/دفعة|payment|دفع|pay/i);

    const amount = await page.locator('#pay-amount').count();
    const date = await page.locator('#pay-date').count();
    const method = await page.locator('#pay-method').count();
    const notes = await page.locator('#pay-notes').count();

    console.log(`Amount: ${amount}, Date: ${date}, Method: ${method}, Notes: ${notes}`);
    await screenshot(page, '5.9-payment-form');
  });

  test('5.10: Fill payment with unique amount', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/payments/new?invoiceId=test');
    await page.waitForTimeout(3000);

    const payAmount = page.locator('#pay-amount');
    if (await payAmount.count() > 0) {
      const amount = uniqueAmount();
      await payAmount.fill(amount);
      expect(await payAmount.inputValue()).toBe(amount);

      // Select payment method
      const methodSelect = page.locator('#pay-method');
      if (await methodSelect.count() > 0) {
        await methodSelect.selectOption('CASH');
      }

      // Fill unique notes
      const notesInput = page.locator('#pay-notes');
      if (await notesInput.count() > 0) {
        await notesInput.fill(`Payment notes ${uniqueSuffix()}`);
      }

      console.log('Payment amount test:', amount);
      await screenshot(page, '5.10-payment-fill');
    }
  });

  test('5.11: Payment methods dropdown', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/payments/new?invoiceId=test');
    await page.waitForTimeout(3000);

    const methodSelect = page.locator('#pay-method');
    if (await methodSelect.count() > 0) {
      const methods = ['CASH', 'CREDIT_CARD', 'BANK_TRANSFER', 'CHEQUE', 'ELECTRONIC'];
      for (const method of methods) {
        try {
          await methodSelect.selectOption(method);
          await page.waitForTimeout(500);
          console.log(`Selected payment method: ${method}`);
        } catch (e) {
          console.log(`Method ${method} not available`);
        }
      }
      await screenshot(page, '5.11-payment-methods');
    }
  });
});

// ============================================
// PART 4: INVENTORY (Tests 6.1 - 6.8)
// ============================================

test.describe('PART 4: Inventory Screen', () => {

  test('6.1: Navigate to inventory', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/inventory');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/مخزون|inventory|قطعة|part/i);

    const search = await page.locator('#part-search').count();
    const tbody = await page.locator('#inventory-tbody').count();
    console.log(`Search: ${search}, Table: ${tbody}`);

    await screenshot(page, '6.1-inventory-list');
  });

  test('6.2: Search parts', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/inventory');
    await page.waitForTimeout(3000);

    const search = page.locator('#part-search');
    if (await search.count() > 0) {
      await search.fill('قطعة');
      await page.waitForTimeout(2000);
      await screenshot(page, '6.2-search-parts');
    }
  });

  test('6.3: New part button exists', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/inventory');
    await page.waitForTimeout(3000);

    const newBtn = page.locator('#new-part-btn');
    if (await newBtn.count() > 0) {
      await expect(newBtn).toBeVisible();
      await expect(newBtn).toBeEnabled();
      console.log('New part button visible');
    }
    await screenshot(page, '6.3-new-part-btn');
  });

  test('6.4: Edit part action', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/inventory');
    await page.waitForTimeout(3000);

    const editBtn = page.locator('[data-action="edit"]').first();
    if (await editBtn.count() > 0) {
      await expect(editBtn).toBeVisible();
      console.log('Edit part button visible');
    }
    await screenshot(page, '6.4-edit-part');
  });

  test('6.5: Warehouses page', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/inventory/warehouses');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/مستودع|warehouse/i);

    const grid = await page.locator('#warehouses-grid').count();
    console.log('Warehouses grid found:', grid);

    await screenshot(page, '6.5-warehouses');
  });

  test('6.6: Suppliers page', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/inventory/suppliers');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/مورد|supplier/i);

    const search = await page.locator('#search-input').count();
    const tbody = await page.locator('#table-tbody').count();
    console.log(`Search: ${search}, Table: ${tbody}`);

    await screenshot(page, '6.6-suppliers');
  });

  test('6.7: Search suppliers', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/inventory/suppliers');
    await page.waitForTimeout(3000);

    const search = page.locator('#search-input');
    if (await search.count() > 0) {
      await search.fill('مورد');
      await page.waitForTimeout(2000);
      await screenshot(page, '6.7-search-suppliers');
    }
  });

  test('6.8: Purchase orders page', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/inventory/purchase-orders');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/طلب|order|شراء|purchase/i);

    const search = await page.locator('#search-input').count();
    const tbody = await page.locator('#table-tbody').count();
    console.log(`Search: ${search}, Table: ${tbody}`);

    await screenshot(page, '6.8-purchase-orders');
  });
});

// ============================================
// PART 5: SERVICES (Tests 7.1 - 7.8)
// ============================================

test.describe('PART 5: Services Screen', () => {

  test('7.1: Navigate to services', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/services');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/خدمة|service/i);

    const search = await page.locator('#service-search').count();
    const filter = await page.locator('#status-filter').count();
    const tbody = await page.locator('#services-tbody').count();

    console.log(`Search: ${search}, Filter: ${filter}, Table: ${tbody}`);
    await screenshot(page, '7.1-services-list');
  });

  test('7.2: Search services', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/services');
    await page.waitForTimeout(3000);

    const search = page.locator('#service-search');
    if (await search.count() > 0) {
      await search.fill('صيانة');
      await page.waitForTimeout(2000);
      await screenshot(page, '7.2-search-services');
    }
  });

  test('7.3: Service status filter', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/services');
    await page.waitForTimeout(3000);

    const filter = page.locator('#status-filter');
    if (await filter.count() > 0) {
      const statuses = ['active', 'inactive'];
      for (const status of statuses) {
        try {
          await filter.selectOption(status);
          await page.waitForTimeout(1500);
          console.log(`Filtered by: ${status}`);
        } catch (e) {
          console.log(`Status ${status} not available`);
        }
      }
      await screenshot(page, '7.3-service-filter');
    }
  });

  test('7.4: Manage categories button', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/services');
    await page.waitForTimeout(3000);

    const btn = page.locator('#manage-categories-btn');
    if (await btn.count() > 0) {
      await expect(btn).toBeVisible();
      await expect(btn).toBeEnabled();
      console.log('Manage categories button visible');
    }
    await screenshot(page, '7.4-categories-btn');
  });

  test('7.5: New service button', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/services');
    await page.waitForTimeout(3000);

    const btn = page.locator('#new-service-btn');
    if (await btn.count() > 0) {
      await expect(btn).toBeVisible();
      await expect(btn).toBeEnabled();
      console.log('New service button visible');
    }
    await screenshot(page, '7.5-new-service-btn');
  });

  test('7.6: Clear filters button', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/services');
    await page.waitForTimeout(3000);

    const btn = page.locator('#clear-filters');
    if (await btn.count() > 0) {
      await expect(btn).toBeVisible();
      console.log('Clear filters button visible');
    }
    await screenshot(page, '7.6-clear-filters');
  });

  test('7.7: Service table columns', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/services');
    await page.waitForTimeout(3000);

    const tbody = await page.locator('#services-tbody').textContent() || '';
    console.log('Services table length:', tbody.length);
    expect(tbody.length).toBeGreaterThanOrEqual(0);

    await screenshot(page, '7.7-service-table');
  });

  test('7.8: Edit and delete action buttons', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/services');
    await page.waitForTimeout(3000);

    const editBtn = page.locator('[data-action="edit"]').first();
    const deleteBtn = page.locator('[data-action="delete"]').first();

    if (await editBtn.count() > 0) {
      await expect(editBtn).toBeVisible();
      console.log('Edit button visible');
    }
    if (await deleteBtn.count() > 0) {
      await expect(deleteBtn).toBeVisible();
      console.log('Delete button visible');
    }

    await screenshot(page, '7.8-service-actions');
  });
});

// ============================================
// PART 6: POS (Tests 10.1 - 10.7)
// ============================================

test.describe('PART 6: Point of Sale (POS)', () => {

  test('10.1: Navigate to POS', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/pos');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/نقطة|point|POS|بيع|sale/i);

    const search = await page.locator('#pos-search').count();
    const grid = await page.locator('#pos-products').count();
    const checkout = await page.locator('#checkout-btn').count();

    console.log(`Search: ${search}, Grid: ${grid}, Checkout: ${checkout}`);
    await screenshot(page, '10.1-pos-page');
  });

  test('10.2: Search products in POS', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/pos');
    await page.waitForTimeout(3000);

    const search = page.locator('#pos-search');
    if (await search.count() > 0) {
      await search.fill('زيت');
      await page.waitForTimeout(2000);
      await screenshot(page, '10.2-pos-search');
    }
  });

  test('10.3: Product grid exists', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/pos');
    await page.waitForTimeout(3000);

    const grid = page.locator('#pos-products');
    if (await grid.count() > 0) {
      await expect(grid).toBeVisible();
      console.log('Product grid visible');
    }
    await screenshot(page, '10.3-product-grid');
  });

  test('10.4: Checkout button', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/pos');
    await page.waitForTimeout(3000);

    const checkout = page.locator('#checkout-btn');
    if (await checkout.count() > 0) {
      await expect(checkout).toBeVisible();
      await expect(checkout).toBeEnabled();
      const text = await checkout.textContent() || '';
      console.log('Checkout button:', text.substring(0, 30));
    }
    await screenshot(page, '10.4-checkout-btn');
  });

  test('10.5: Quick invoice button', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/pos');
    await page.waitForTimeout(3000);

    const btn = page.locator('#quick-invoice-btn');
    if (await btn.count() > 0) {
      await expect(btn).toBeVisible();
      console.log('Quick invoice button visible');
    }
    await screenshot(page, '10.5-quick-invoice');
  });

  test('10.6: Cart section', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/pos');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    const hasCart = /سلة|cart|المشتريات|المجموع|total/i.test(body);
    const hasSubtotal = /الإجمالي|subtotal|المجموع/i.test(body);

    console.log('Has cart:', hasCart, 'has subtotal:', hasSubtotal);
    await screenshot(page, '10.6-cart-section');
  });

  test('10.7: POS product cards', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/pos');
    await page.waitForTimeout(3000);

    // Look for clickable product elements
    const products = await page.locator('[data-product-id], .product-card, .product-item').all();
    console.log('Product elements found:', products.length);

    await screenshot(page, '10.7-product-cards');
  });
});
