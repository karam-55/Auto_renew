import { test, expect } from '@playwright/test';

/**
 * GROUP 3 CRUD REAL: Financial - Actual data creation
 * Creates real invoices, payments, parts, services
 * Data REMAINS in the database after tests
 */

test.use({
  viewport: { width: 1920, height: 1080 },
  launchOptions: { slowMo: 200 },
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
  await page.screenshot({ path: `test-results/crud3-${name}.png`, fullPage: true });
}

function uniqueSuffix(): string {
  return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function uniqueInvoiceNumber(): string {
  return `INV-${uniqueSuffix()}`;
}

function uniquePartName(): string {
  return `TestPart_${uniqueSuffix()}`;
}

function uniquePartCode(): string {
  return `TPC-${Math.floor(10000 + Math.random() * 89999)}`;
}

function uniqueServiceName(): string {
  return `TestService_${uniqueSuffix()}`;
}

function uniqueSupplierName(): string {
  return `TestSupplier_${uniqueSuffix()}`;
}

function uniqueWarehouseName(): string {
  return `TestWH_${uniqueSuffix()}`;
}

function uniqueAmount(): string {
  return String(Math.floor(1000 + Math.random() * 99000));
}

// ============================================
// PART 1: CREATE INVOICE (Real)
// ============================================

test.describe('PART 1: Create Real Invoice', () => {

  test('CRUD-5.1: Create manual invoice', async ({ page }) => {
    const invoiceNum = uniqueInvoiceNumber();
    const amount = uniqueAmount();

    await login(page);

    // Go to new invoice
    await page.goto('http://localhost:1420#/invoices/new');
    await page.waitForTimeout(3000);

    // Select customer
    const customerSelect = page.locator('#customer-select');
    if (await customerSelect.count() > 0) {
      const options = await customerSelect.locator('option').all();
      if (options.length > 1) {
        await customerSelect.selectOption({ index: 1 });
        await page.waitForTimeout(1000);
      }
    }

    // Fill invoice details
    const numInput = page.locator('#invoice-number');
    if (await numInput.count() > 0) {
      await numInput.fill(invoiceNum);
    }

    const amountInput = page.locator('#invoice-amount');
    if (await amountInput.count() > 0) {
      await amountInput.fill(amount);
    }

    // Save invoice (REAL CREATE)
    const saveBtn = page.locator('#save-invoice-btn, [data-action="save-invoice"]');
    if (await saveBtn.count() > 0) {
      await saveBtn.click();
      await page.waitForTimeout(3000);

      const body = await page.locator('body').textContent() || '';
      const success = /تم|success|created|فاتورة/i.test(body);
      console.log(`Invoice ${invoiceNum} created, Amount: ${amount}, Success: ${success}`);
    } else {
      console.log('Invoice save button not found');
    }

    await screenshot(page, 'crud-5.1-invoice-created');
  });

  test('CRUD-5.2: Create invoice with discount', async ({ page }) => {
    const invoiceNum = uniqueInvoiceNumber();
    const amount = '50000';
    const discount = '10'; // 10%

    await login(page);

    await page.goto('http://localhost:1420#/invoices/new');
    await page.waitForTimeout(3000);

    const customerSelect = page.locator('#customer-select');
    if (await customerSelect.count() > 0) {
      const options = await customerSelect.locator('option').all();
      if (options.length > 1) {
        await customerSelect.selectOption({ index: 1 });
      }
    }

    const numInput = page.locator('#invoice-number');
    if (await numInput.count() > 0) {
      await numInput.fill(invoiceNum);
    }

    const amountInput = page.locator('#invoice-amount');
    if (await amountInput.count() > 0) {
      await amountInput.fill(amount);
    }

    // Apply discount
    const discountType = page.locator('#discount-type');
    if (await discountType.count() > 0) {
      await discountType.selectOption('PERCENTAGE');
    }

    const discountValue = page.locator('#discount-value');
    if (await discountValue.count() > 0) {
      await discountValue.fill(discount);
    }

    // Apply discount button
    const applyBtn = page.locator('#apply-discount-btn');
    if (await applyBtn.count() > 0) {
      await applyBtn.click();
      await page.waitForTimeout(1000);
    }

    // Save
    const saveBtn = page.locator('#save-invoice-btn, [data-action="save-invoice"]');
    if (await saveBtn.count() > 0) {
      await saveBtn.click();
      await page.waitForTimeout(3000);
      console.log(`Invoice ${invoiceNum} with ${discount}% discount created`);
    }

    await screenshot(page, 'crud-5.2-invoice-discount');
  });
});

// ============================================
// PART 2: RECORD PAYMENT (Real)
// ============================================

test.describe('PART 2: Record Real Payment', () => {

  test('CRUD-5.3: Record payment for invoice', async ({ page }) => {
    const paymentAmount = uniqueAmount();
    const paymentNotes = `Payment notes ${uniqueSuffix()}`;

    await login(page);

    // Go to invoices to find one
    await page.goto('http://localhost:1420#/invoices');
    await page.waitForTimeout(3000);

    // Click pay on first invoice
    const payBtn = page.locator('[data-action="pay"]').first();
    if (await payBtn.count() > 0) {
      await payBtn.click();
      await page.waitForTimeout(3000);

      // Fill payment form
      const amountInput = page.locator('#pay-amount');
      if (await amountInput.count() > 0) {
        await amountInput.fill(paymentAmount);
      }

      const methodSelect = page.locator('#pay-method');
      if (await methodSelect.count() > 0) {
        await methodSelect.selectOption('CASH');
      }

      const notesInput = page.locator('#pay-notes');
      if (await notesInput.count() > 0) {
        await notesInput.fill(paymentNotes);
      }

      // Save payment (REAL CREATE)
      const saveBtn = page.locator('#save-btn, [data-action="save-payment"]');
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(3000);
        console.log(`Payment recorded: ${paymentAmount}, Notes: ${paymentNotes}`);
      }
    } else {
      console.log('No pay button found - create an invoice first');
    }

    await screenshot(page, 'crud-5.3-payment-recorded');
  });

  test('CRUD-5.4: Record payment with different methods', async ({ page }) => {
    const methods = ['CASH', 'CREDIT_CARD', 'BANK_TRANSFER'];

    await login(page);
    await page.goto('http://localhost:1420#/invoices');
    await page.waitForTimeout(3000);

    const payBtn = page.locator('[data-action="pay"]').first();
    if (await payBtn.count() > 0) {
      await payBtn.click();
      await page.waitForTimeout(3000);

      for (const method of methods) {
        const methodSelect = page.locator('#pay-method');
        if (await methodSelect.count() > 0) {
          await methodSelect.selectOption(method);
          await page.waitForTimeout(500);
          console.log(`Selected payment method: ${method}`);
        }
      }

      // Fill amount
      const amountInput = page.locator('#pay-amount');
      if (await amountInput.count() > 0) {
        await amountInput.fill(uniqueAmount());
      }
    }

    await screenshot(page, 'crud-5.4-payment-methods');
  });
});

// ============================================
// PART 3: CREATE INVENTORY PART (Real)
// ============================================

test.describe('PART 3: Create Real Inventory Part', () => {

  test('CRUD-6.1: Create new part', async ({ page }) => {
    const partName = uniquePartName();
    const partCode = uniquePartCode();
    const quantity = String(Math.floor(10 + Math.random() * 990));
    const minQty = String(Math.floor(5 + Math.random() * 50));
    const price = String(Math.floor(100 + Math.random() * 9900));

    await login(page);

    await page.goto('http://localhost:1420#/inventory');
    await page.waitForTimeout(3000);

    const newBtn = page.locator('#new-part-btn');
    if (await newBtn.count() > 0) {
      await newBtn.click();
      await page.waitForTimeout(2000);

      await page.locator('#part-name').fill(partName);
      await page.locator('#part-code').fill(partCode);
      await page.locator('#part-quantity').fill(quantity);
      await page.locator('#part-min-quantity').fill(minQty);
      await page.locator('#part-price').fill(price);

      // Select category if exists
      const categorySelect = page.locator('#part-category');
      if (await categorySelect.count() > 0) {
        const options = await categorySelect.locator('option').all();
        if (options.length > 1) {
          await categorySelect.selectOption({ index: 1 });
        }
      }

      // Save part (REAL CREATE)
      const saveBtn = page.locator('#save-part-btn, [data-action="save-part"]');
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(3000);
        console.log(`Part created: ${partName}, Code: ${partCode}, Qty: ${quantity}, Price: ${price}`);
      }
    } else {
      console.log('New part button not found');
    }

    await screenshot(page, 'crud-6.1-part-created');
  });

  test('CRUD-6.2: Create multiple parts', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/inventory');
    await page.waitForTimeout(3000);

    const parts = [
      { name: uniquePartName(), code: uniquePartCode(), qty: '100', price: '500' },
      { name: uniquePartName(), code: uniquePartCode(), qty: '50', price: '1200' },
    ];

    for (const part of parts) {
      const newBtn = page.locator('#new-part-btn');
      if (await newBtn.count() > 0) {
        await newBtn.click();
        await page.waitForTimeout(1500);

        await page.locator('#part-name').fill(part.name);
        await page.locator('#part-code').fill(part.code);
        await page.locator('#part-quantity').fill(part.qty);
        await page.locator('#part-price').fill(part.price);

        const saveBtn = page.locator('#save-part-btn, [data-action="save-part"]');
        if (await saveBtn.count() > 0) {
          await saveBtn.click();
          await page.waitForTimeout(2000);
          console.log(`Created part: ${part.name}`);
        }
      }
    }

    await screenshot(page, 'crud-6.2-multiple-parts');
  });
});

// ============================================
// PART 4: CREATE SERVICE (Real)
// ============================================

test.describe('PART 4: Create Real Service', () => {

  test('CRUD-7.1: Create new service', async ({ page }) => {
    const serviceName = uniqueServiceName();
    const priceSYP = String(Math.floor(5000 + Math.random() * 95000));
    const priceUSD = String(Math.floor(10 + Math.random() * 490));
    const description = `Service description ${uniqueSuffix()}`;

    await login(page);

    await page.goto('http://localhost:1420#/services');
    await page.waitForTimeout(3000);

    const newBtn = page.locator('#new-service-btn');
    if (await newBtn.count() > 0) {
      await newBtn.click();
      await page.waitForTimeout(2000);

      await page.locator('#service-name').fill(serviceName);
      await page.locator('#service-price-syp').fill(priceSYP);
      await page.locator('#service-price-usd').fill(priceUSD);
      await page.locator('#service-description').fill(description);

      // Select category
      const categorySelect = page.locator('#svc-category');
      if (await categorySelect.count() > 0) {
        const options = await categorySelect.locator('option').all();
        if (options.length > 1) {
          await categorySelect.selectOption({ index: 1 });
        }
      }

      // Select status
      const statusSelect = page.locator('#service-status');
      if (await statusSelect.count() > 0) {
        await statusSelect.selectOption('active');
      }

      // Save service (REAL CREATE)
      const saveBtn = page.locator('#save-service-btn, [data-action="save-service"]');
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(3000);
        console.log(`Service created: ${serviceName}, SYP: ${priceSYP}, USD: ${priceUSD}`);
      }
    } else {
      console.log('New service button not found');
    }

    await screenshot(page, 'crud-7.1-service-created');
  });

  test('CRUD-7.2: Create multiple services', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/services');
    await page.waitForTimeout(3000);

    const services = [
      { name: uniqueServiceName(), price: '15000' },
      { name: uniqueServiceName(), price: '25000' },
      { name: uniqueServiceName(), price: '35000' },
    ];

    for (const service of services) {
      const newBtn = page.locator('#new-service-btn');
      if (await newBtn.count() > 0) {
        await newBtn.click();
        await page.waitForTimeout(1500);

        await page.locator('#service-name').fill(service.name);
        await page.locator('#service-price-syp').fill(service.price);

        const saveBtn = page.locator('#save-service-btn, [data-action="save-service"]');
        if (await saveBtn.count() > 0) {
          await saveBtn.click();
          await page.waitForTimeout(2000);
          console.log(`Created service: ${service.name}`);
        }
      }
    }

    await screenshot(page, 'crud-7.2-multiple-services');
  });
});

// ============================================
// PART 5: POS SALE (Real)
// ============================================

test.describe('PART 5: POS Real Sale', () => {

  test('CRUD-10.1: Add products to cart and checkout', async ({ page }) => {
    await login(page);

    await page.goto('http://localhost:1420#/pos');
    await page.waitForTimeout(3000);

    // Add first product to cart
    const productBtn = page.locator('[data-product-id]').first();
    if (await productBtn.count() > 0) {
      await productBtn.click();
      await page.waitForTimeout(1000);
      console.log('Added product to cart');

      // Add another product
      const productBtn2 = page.locator('[data-product-id]').nth(1);
      if (await productBtn2.count() > 0) {
        await productBtn2.click();
        await page.waitForTimeout(1000);
        console.log('Added second product');
      }
    }

    // Click checkout (REAL SALE)
    const checkoutBtn = page.locator('#checkout-btn');
    if (await checkoutBtn.count() > 0) {
      await checkoutBtn.click();
      await page.waitForTimeout(3000);
      console.log('Checkout completed');
    }

    await screenshot(page, 'crud-10.1-pos-sale');
  });

  test('CRUD-10.2: Quick invoice from POS', async ({ page }) => {
    await login(page);

    await page.goto('http://localhost:1420#/pos');
    await page.waitForTimeout(3000);

    const quickBtn = page.locator('#quick-invoice-btn');
    if (await quickBtn.count() > 0) {
      await quickBtn.click();
      await page.waitForTimeout(3000);

      const body = await page.locator('body').textContent() || '';
      const hasInvoice = /فاتورة|invoice|تم/i.test(body);
      console.log('Quick invoice created:', hasInvoice);
    }

    await screenshot(page, 'crud-10.2-quick-invoice');
  });
});

// ============================================
// SUMMARY
// ============================================

test.describe('SUMMARY: Financial Data Created', () => {
  test('SUMMARY: List all financial test data', async ({ page, request }) => {
    await login(page);

    const token = await page.evaluate(() => localStorage.getItem('token'));

    const invoicesRes = await request.get('http://localhost:8080/api/invoices', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const invoicesData = await invoicesRes.json();

    const partsRes = await request.get('http://localhost:8080/api/parts', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const partsData = await partsRes.json();

    const servicesRes = await request.get('http://localhost:8080/api/services', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const servicesData = await servicesRes.json();

    console.log('\n========== FINANCIAL TEST DATA ==========');
    console.log('Total Invoices:', invoicesData.data?.length || invoicesData.length || 0);
    console.log('Total Parts:', partsData.data?.length || partsData.length || 0);
    console.log('Total Services:', servicesData.data?.length || servicesData.length || 0);
    console.log('Note: Test data with "Test_" or "INV-" prefix was created');
    console.log('========================================\n');

    await screenshot(page, 'crud3-summary');
  });
});
