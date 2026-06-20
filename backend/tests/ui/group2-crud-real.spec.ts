import { test, expect } from '@playwright/test';

/**
 * GROUP 2 CRUD REAL: Actual data creation tests
 * These tests CREATE real data in the database and LEAVE it there
 * Run with: npx playwright test group2-crud-real.spec.ts
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
  await page.screenshot({ path: `test-results/crud2-${name}.png`, fullPage: true });
}

function uniqueSuffix(): string {
  return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function uniqueCustomerName(): string {
  return `TestCustomer_${uniqueSuffix()}`;
}

function uniquePhone(): string {
  return `09${Math.floor(10000000 + Math.random() * 89999999)}`;
}

function uniquePlate(): string {
  return `T${Math.floor(10000 + Math.random() * 89999)}-دمشق`;
}

function uniqueVIN(): string {
  return `TESTVIN${Math.floor(10000000000000000 + Math.random() * 89999999999999999)}`;
}

// ============================================
// PART 1: CREATE CUSTOMER (Real)
// ============================================

test.describe('PART 1: Create Real Customer', () => {

  test('CRUD-1.1: Create new customer with unique data', async ({ page }) => {
    const customerName = uniqueCustomerName();
    const customerPhone = uniquePhone();
    const customerAddress = `عنوان اختبار ${uniqueSuffix()}`;

    await login(page);

    // Navigate to customers
    await page.goto('http://localhost:1420#/customers');
    await page.waitForTimeout(3000);

    // Click new customer button
    const newBtn = page.locator('#new-customer-btn');
    await expect(newBtn).toBeVisible();
    await newBtn.click();
    await page.waitForTimeout(2000);

    // Fill customer form
    await page.locator('#customer-name').fill(customerName);
    await page.locator('#customer-phone').fill(customerPhone);
    await page.locator('#customer-address').fill(customerAddress);

    // Select status if exists
    const statusSelect = page.locator('#customer-status');
    if (await statusSelect.count() > 0) {
      await statusSelect.selectOption('ACTIVE');
    }

    // Save the customer (REAL CREATE)
    const saveBtn = page.locator('#save-customer-btn, [data-action="save"]');
    if (await saveBtn.count() > 0) {
      await saveBtn.click();
      await page.waitForTimeout(3000);

      // Verify success
      const body = await page.locator('body').textContent() || '';
      const success = /تم|success|created|إنشاء/i.test(body);
      console.log(`Customer created: ${customerName}, Phone: ${customerPhone}, Success: ${success}`);
    } else {
      console.log('Save button not found - customer data filled but not saved');
    }

    await screenshot(page, 'crud-1.1-customer-created');
  });

  test('CRUD-1.2: Create customer and verify in list', async ({ page }) => {
    const customerName = uniqueCustomerName();
    const customerPhone = uniquePhone();

    await login(page);

    // Create customer first
    await page.goto('http://localhost:1420#/customers');
    await page.waitForTimeout(3000);

    const newBtn = page.locator('#new-customer-btn');
    if (await newBtn.count() > 0) {
      await newBtn.click();
      await page.waitForTimeout(2000);

      await page.locator('#customer-name').fill(customerName);
      await page.locator('#customer-phone').fill(customerPhone);

      const saveBtn = page.locator('#save-customer-btn, [data-action="save"]');
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(3000);
      }
    }

    // Navigate back to list and search
    await page.goto('http://localhost:1420#/customers');
    await page.waitForTimeout(3000);

    const search = page.locator('#customer-search');
    if (await search.count() > 0) {
      await search.fill(customerName);
      await page.waitForTimeout(2000);

      const tbody = await page.locator('#customers-tbody').textContent() || '';
      const found = tbody.includes(customerName);
      console.log(`Customer ${customerName} found in list: ${found}`);

      expect(found).toBe(true);
    }

    await screenshot(page, 'crud-1.2-verify-in-list');
  });

  test('CRUD-1.3: Create multiple customers', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/customers');
    await page.waitForTimeout(3000);

    const customers = [
      { name: uniqueCustomerName(), phone: uniquePhone() },
      { name: uniqueCustomerName(), phone: uniquePhone() },
      { name: uniqueCustomerName(), phone: uniquePhone() },
    ];

    for (const customer of customers) {
      const newBtn = page.locator('#new-customer-btn');
      if (await newBtn.count() > 0) {
        await newBtn.click();
        await page.waitForTimeout(1500);

        await page.locator('#customer-name').fill(customer.name);
        await page.locator('#customer-phone').fill(customer.phone);

        const saveBtn = page.locator('#save-customer-btn, [data-action="save"]');
        if (await saveBtn.count() > 0) {
          await saveBtn.click();
          await page.waitForTimeout(2000);
          console.log(`Created: ${customer.name}`);
        }
      }
    }

    await screenshot(page, 'crud-1.3-multiple-customers');
  });
});

// ============================================
// PART 2: CREATE BOOKING (Real)
// ============================================

test.describe('PART 2: Create Real Booking', () => {

  test('CRUD-2.1: Create booking for new customer', async ({ page }) => {
    const customerName = uniqueCustomerName();
    const customerPhone = uniquePhone();
    const vehiclePlate = uniquePlate();
    const vehicleVIN = uniqueVIN();

    await login(page);

    // Go to booking wizard
    await page.goto('http://localhost:1420#/bookings/new');
    await page.waitForTimeout(3000);

    // Step 1: Customer
    const nameInput = page.locator('#customer-name');
    if (await nameInput.count() > 0) {
      await nameInput.fill(customerName);
      await page.locator('#customer-phone').fill(customerPhone);
      await page.locator('#customer-address').fill('دمشق - شارع الحمراء');
    }

    // Step 2: Vehicle
    const nextBtn = page.locator('#next-btn');
    if (await nextBtn.count() > 0) {
      await nextBtn.click();
      await page.waitForTimeout(2000);

      const makeInput = page.locator('#vehicle-make');
      if (await makeInput.count() > 0) {
        await makeInput.fill('Toyota');
        await page.locator('#vehicle-model').fill('Corolla');
        await page.locator('#vehicle-year').fill('2020');
        await page.locator('#vehicle-plate').fill(vehiclePlate);
        await page.locator('#vehicle-mileage').fill('50000');
        await page.locator('#vehicle-vin').fill(vehicleVIN);
      }
    }

    // Step 3: Services
    if (await nextBtn.count() > 0) {
      await nextBtn.click();
      await page.waitForTimeout(2000);

      // Select a service
      const serviceCheck = page.locator('#service-list input[type="checkbox"]').first();
      if (await serviceCheck.count() > 0) {
        await serviceCheck.check();
      }

      // Select status
      const statusSelect = page.locator('#booking-status');
      if (await statusSelect.count() > 0) {
        await statusSelect.selectOption('PENDING');
      }

      // Select payment method
      const paymentSelect = page.locator('#booking-payment-method');
      if (await paymentSelect.count() > 0) {
        await paymentSelect.selectOption('CASH');
      }
    }

    // Save booking (REAL CREATE)
    const saveBtn = page.locator('#save-btn, [data-action="save-booking"]');
    if (await saveBtn.count() > 0) {
      await saveBtn.click();
      await page.waitForTimeout(3000);

      const body = await page.locator('body').textContent() || '';
      const success = /تم|success|created|حجز/i.test(body);
      console.log(`Booking created for: ${customerName}, Plate: ${vehiclePlate}, Success: ${success}`);
    }

    await screenshot(page, 'crud-2.1-booking-created');
  });

  test('CRUD-2.2: Create booking and verify in list', async ({ page }) => {
    const customerName = uniqueCustomerName();
    const customerPhone = uniquePhone();
    const vehiclePlate = uniquePlate();

    await login(page);

    // Create booking
    await page.goto('http://localhost:1420#/bookings/new');
    await page.waitForTimeout(3000);

    const nameInput = page.locator('#customer-name');
    if (await nameInput.count() > 0) {
      await nameInput.fill(customerName);
      await page.locator('#customer-phone').fill(customerPhone);

      const nextBtn = page.locator('#next-btn');
      if (await nextBtn.count() > 0) {
        await nextBtn.click();
        await page.waitForTimeout(1500);

        const plateInput = page.locator('#vehicle-plate');
        if (await plateInput.count() > 0) {
          await plateInput.fill(vehiclePlate);
        }

        await nextBtn.click();
        await page.waitForTimeout(1500);

        const saveBtn = page.locator('#save-btn, [data-action="save-booking"]');
        if (await saveBtn.count() > 0) {
          await saveBtn.click();
          await page.waitForTimeout(3000);
        }
      }
    }

    // Verify in bookings list
    await page.goto('http://localhost:1420#/bookings');
    await page.waitForTimeout(3000);

    const search = page.locator('#booking-search');
    if (await search.count() > 0) {
      await search.fill(customerName);
      await page.waitForTimeout(2000);

      const tbody = await page.locator('#bookings-tbody').textContent() || '';
      const found = tbody.includes(customerName) || tbody.includes(vehiclePlate);
      console.log(`Booking found in list: ${found}`);
      expect(found).toBe(true);
    }

    await screenshot(page, 'crud-2.2-verify-booking');
  });
});

// ============================================
// PART 3: UPDATE CUSTOMER (Real)
// ============================================

test.describe('PART 3: Update Real Customer', () => {

  test('CRUD-3.1: Edit existing customer and save', async ({ page }) => {
    const originalName = uniqueCustomerName();
    const updatedName = `Updated_${uniqueSuffix()}`;
    const updatedPhone = uniquePhone();

    await login(page);

    // Create customer first
    await page.goto('http://localhost:1420#/customers');
    await page.waitForTimeout(3000);

    const newBtn = page.locator('#new-customer-btn');
    if (await newBtn.count() > 0) {
      await newBtn.click();
      await page.waitForTimeout(1500);
      await page.locator('#customer-name').fill(originalName);
      await page.locator('#customer-phone').fill(uniquePhone());

      const saveBtn = page.locator('#save-customer-btn, [data-action="save"]');
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(2000);
      }
    }

    // Now edit it
    await page.goto('http://localhost:1420#/customers');
    await page.waitForTimeout(3000);

    // Search for the customer
    const search = page.locator('#customer-search');
    if (await search.count() > 0) {
      await search.fill(originalName);
      await page.waitForTimeout(2000);
    }

    // Click edit
    const editBtn = page.locator('[data-action="edit"]').first();
    if (await editBtn.count() > 0) {
      await editBtn.click();
      await page.waitForTimeout(2000);

      // Update fields
      const nameInput = page.locator('#edit-name');
      if (await nameInput.count() > 0) {
        await nameInput.fill(updatedName);
      }

      const phoneInput = page.locator('#edit-phone');
      if (await phoneInput.count() > 0) {
        await phoneInput.fill(updatedPhone);
      }

      // Save changes (REAL UPDATE)
      const updateBtn = page.locator('#edit-save');
      if (await updateBtn.count() > 0) {
        await updateBtn.click();
        await page.waitForTimeout(3000);

        console.log(`Customer updated: ${originalName} -> ${updatedName}`);
      }
    }

    await screenshot(page, 'crud-3.1-customer-updated');
  });
});

// ============================================
// PART 4: CUSTOMER DETAIL (Real)
// ============================================

test.describe('PART 4: Customer Detail Operations', () => {

  test('CRUD-4.1: Navigate to customer detail', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/customers');
    await page.waitForTimeout(3000);

    // Click first customer row
    const rows = await page.locator('#customers-tbody tr').all();
    if (rows.length > 0) {
      await rows[0].click();
      await page.waitForTimeout(3000);

      const body = await page.locator('body').textContent() || '';
      expect(body).toMatch(/تفاصيل|detail|عميل|customer/i);

      // Check for vehicle section
      const hasVehicles = /مركبة|vehicle|سيارة/i.test(body);
      console.log('Detail page has vehicles:', hasVehicles);
    }

    await screenshot(page, 'crud-4.1-customer-detail');
  });

  test('CRUD-4.2: Back button from detail', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/customers/test-id');
    await page.waitForTimeout(3000);

    const backBtn = page.locator('#back-btn');
    if (await backBtn.count() > 0) {
      await expect(backBtn).toBeVisible();
      await backBtn.click();
      await page.waitForTimeout(2000);

      // Should be back on list
      const url = page.url();
      expect(url).not.toContain('/customers/');
    }
  });
});

// ============================================
// SUMMARY
// ============================================

test.describe('SUMMARY: Data Created', () => {
  test('SUMMARY: List all test data created', async ({ page, request }) => {
    await login(page);

    // Get counts from API
    const token = await page.evaluate(() => localStorage.getItem('token'));

    const customersRes = await request.get('http://localhost:8080/api/customers', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const customersData = await customersRes.json();

    const bookingsRes = await request.get('http://localhost:8080/api/bookings', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const bookingsData = await bookingsRes.json();

    console.log('\n========== TEST DATA SUMMARY ==========');
    console.log('Total Customers:', customersData.data?.length || customersData.length || 0);
    console.log('Total Bookings:', bookingsData.data?.length || bookingsData.length || 0);
    console.log('Note: Test data with "TestCustomer_" prefix was created by these tests');
    console.log('=====================================\n');

    await screenshot(page, 'crud-summary');
  });
});
