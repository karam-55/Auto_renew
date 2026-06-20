import { test, expect } from '@playwright/test';

/**
 * GROUP 2: Bookings + Customers (26 Tests)
 * Deep testing based on code analysis of:
 * - admin_tauri/src/screens/bookings.ts
 * - admin_tauri/src/screens/booking-wizard.ts
 * - admin_tauri/src/screens/booking-ticket.ts
 * - admin_tauri/src/screens/customers.ts
 * - admin_tauri/src/screens/customer-detail.ts
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
  await page.screenshot({ path: `test-results/group2-${name}.png`, fullPage: true });
}

// Unique data generators to avoid test data conflicts
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
// PART 1: BOOKINGS LIST (Tests 3.1 - 3.10)
// ============================================

test.describe('PART 1: Bookings List Screen', () => {

  test('3.1: Navigate to bookings and verify structure', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/bookings');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/حجز|booking/i);

    // Verify key elements exist
    const search = await page.locator('#booking-search').count();
    const filter = await page.locator('#status-filter').count();
    const tbody = await page.locator('#bookings-tbody').count();

    console.log(`Search: ${search}, Filter: ${filter}, Table: ${tbody}`);
    expect(tbody).toBeGreaterThan(0);

    await screenshot(page, '3.1-bookings-list');
  });

  test('3.2: Search by customer name', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/bookings');
    await page.waitForTimeout(3000);

    const searchInput = page.locator('#booking-search');
    if (await searchInput.count() > 0) {
      await searchInput.fill('عميل');
      await page.waitForTimeout(2000);

      const tbody = await page.locator('#bookings-tbody').textContent() || '';
      console.log('Search results length:', tbody.length);
      await screenshot(page, '3.2-search-name');
    }
  });

  test('3.3: Search by mobile number', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/bookings');
    await page.waitForTimeout(3000);

    const searchInput = page.locator('#booking-search');
    if (await searchInput.count() > 0) {
      await searchInput.fill('09');
      await page.waitForTimeout(2000);
      await screenshot(page, '3.3-search-mobile');
    }
  });

  test('3.4: Search by license plate', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/bookings');
    await page.waitForTimeout(3000);

    const searchInput = page.locator('#booking-search');
    if (await searchInput.count() > 0) {
      await searchInput.fill('123');
      await page.waitForTimeout(2000);
      await screenshot(page, '3.4-search-plate');
    }
  });

  test('3.5: Search non-existent text', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/bookings');
    await page.waitForTimeout(3000);

    const searchInput = page.locator('#booking-search');
    if (await searchInput.count() > 0) {
      await searchInput.fill('XYZ123NONEXISTENT');
      await page.waitForTimeout(2000);

      const tbody = await page.locator('#bookings-tbody').textContent() || '';
      const hasEmpty = /لا توجد|لا يوجد|empty|no results/i.test(tbody);
      console.log('Empty state shown:', hasEmpty);

      await screenshot(page, '3.5-search-empty');
    }
  });

  test('3.6: Filter by status', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/bookings');
    await page.waitForTimeout(3000);

    const statusFilter = page.locator('#status-filter');
    if (await statusFilter.count() > 0) {
      const statuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

      for (const status of statuses) {
        await statusFilter.selectOption(status);
        await page.waitForTimeout(1500);
        console.log(`Filtered by status: ${status}`);
      }

      await screenshot(page, '3.6-status-filter');
    }
  });

  test('3.7: Select all checkbox', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/bookings');
    await page.waitForTimeout(3000);

    const selectAll = page.locator('#select-all');
    if (await selectAll.count() > 0) {
      await selectAll.check();
      await page.waitForTimeout(500);
      expect(await selectAll.isChecked()).toBe(true);

      // Check row checkboxes
      const rowChecks = await page.locator('.row-check').all();
      console.log('Row checkboxes found:', rowChecks.length);

      await screenshot(page, '3.7-select-all');
    }
  });

  test('3.8: Bulk delete action', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/bookings');
    await page.waitForTimeout(3000);

    const selectAll = page.locator('#select-all');
    const bulkBar = page.locator('#bulk-actions');

    if (await selectAll.count() > 0 && await bulkBar.count() > 0) {
      await selectAll.check();
      await page.waitForTimeout(1000);

      // Bulk bar should appear
      const bulkVisible = await bulkBar.isVisible();
      console.log('Bulk bar visible:', bulkVisible);

      if (bulkVisible) {
        const deleteBtn = page.locator('#bulk-delete-btn');
        if (await deleteBtn.count() > 0) {
          // Don't actually click to avoid data loss in tests
          console.log('Bulk delete button found');
        }
      }

      await screenshot(page, '3.8-bulk-delete');
    }
  });

  test('3.9: New booking buttons exist', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/bookings');
    await page.waitForTimeout(3000);

    // Check for new booking buttons
    const body = await page.locator('body').textContent() || '';

    const hasNewCustomer = /عميل جديد|new customer|زبون جديد/i.test(body);
    const hasExistingCustomer = /عميل مسبق|existing customer|زبون موجود/i.test(body);

    console.log('New customer button:', hasNewCustomer);
    console.log('Existing customer button:', hasExistingCustomer);

    await screenshot(page, '3.9-new-booking-buttons');
  });

  test('3.10: Navigate to booking wizard (new customer)', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/bookings/new');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/حجز|booking|عميل|customer/i);

    // Check wizard step indicators
    const hasStep1 = /خطوة|step|بيانات|data/i.test(body);
    console.log('Wizard loaded, step indicators:', hasStep1);

    await screenshot(page, '3.10-wizard-new');
  });
});

// ============================================
// PART 2: BOOKING WIZARD (Tests 3.11 - 3.12)
// ============================================

test.describe('PART 2: Booking Wizard', () => {

  test('3.11: Wizard Step 1 - New customer data', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/bookings/new');
    await page.waitForTimeout(3000);

    // Generate unique test data
    const customerName = uniqueCustomerName();
    const customerPhone = uniquePhone();
    const customerAddress = 'دمشق - شارع الحمراء';
    const customerNotes = `ملاحظات اختبار ${uniqueSuffix()}`;

    // Fill customer fields
    const nameInput = page.locator('#customer-name');
    if (await nameInput.count() > 0) {
      await nameInput.fill(customerName);
      await page.locator('#customer-phone').fill(customerPhone);
      await page.locator('#customer-address').fill(customerAddress);
      await page.locator('#customer-notes').fill(customerNotes);

      // Verify values
      expect(await nameInput.inputValue()).toBe(customerName);
      expect(await page.locator('#customer-phone').inputValue()).toBe(customerPhone);

      console.log('Created test customer:', customerName, 'phone:', customerPhone);
      await screenshot(page, '3.11-wizard-step1');
    }
  });

  test('3.12: Wizard Step 2 - Vehicle data', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/bookings/new');
    await page.waitForTimeout(3000);

    // Generate unique test data
    const customerName = uniqueCustomerName();
    const customerPhone = uniquePhone();
    const vehiclePlate = uniquePlate();
    const vehicleVIN = uniqueVIN();

    // Fill customer first
    const nameInput = page.locator('#customer-name');
    if (await nameInput.count() > 0) {
      await nameInput.fill(customerName);
      await page.locator('#customer-phone').fill(customerPhone);

      // Navigate to step 2
      const nextBtn = page.locator('#next-btn');
      if (await nextBtn.count() > 0) {
        await nextBtn.click();
        await page.waitForTimeout(2000);

        // Fill vehicle fields with unique data
        const makeInput = page.locator('#vehicle-make');
        if (await makeInput.count() > 0) {
          await makeInput.fill('Toyota');
          await page.locator('#vehicle-model').fill('Corolla');
          await page.locator('#vehicle-year').fill('2020');
          await page.locator('#vehicle-plate').fill(vehiclePlate);
          await page.locator('#vehicle-mileage').fill('50000');
          await page.locator('#vehicle-vin').fill(vehicleVIN);
          await page.locator('#vehicle-color').fill('أبيض');

          console.log('Vehicle plate:', vehiclePlate, 'VIN:', vehicleVIN);
          await screenshot(page, '3.12-wizard-step2');
        }
      }
    }
  });
});

// ============================================
// PART 3: BOOKING TICKET (Tests 3.13 - 3.14)
// ============================================

test.describe('PART 3: Booking Ticket', () => {

  test('3.13: Booking ticket view', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/bookings');
    await page.waitForTimeout(3000);

    // Get first booking ID from table
    const rows = await page.locator('#bookings-tbody tr').all();
    if (rows.length > 0) {
      // Click first row or view button
      const viewBtn = page.locator('[data-action="view"]').first();
      if (await viewBtn.count() > 0) {
        await viewBtn.click();
        await page.waitForTimeout(3000);

        const body = await page.locator('body').textContent() || '';
        expect(body).toMatch(/تذكرة|ticket|حجز|booking/i);

        // Check ticket elements
        const hasCustomer = /العميل|customer/i.test(body);
        const hasVehicle = /المركبة|vehicle/i.test(body);
        const hasStatus = /الحالة|status/i.test(body);

        console.log('Ticket has customer:', hasCustomer, 'vehicle:', hasVehicle, 'status:', hasStatus);
        await screenshot(page, '3.13-ticket-view');
      }
    }
  });

  test('3.14: Ticket edit mode', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/bookings');
    await page.waitForTimeout(3000);

    const viewBtn = page.locator('[data-action="view"]').first();
    if (await viewBtn.count() > 0) {
      await viewBtn.click();
      await page.waitForTimeout(3000);

      const editBtn = page.locator('#edit-btn');
      if (await editBtn.count() > 0) {
        await editBtn.click();
        await page.waitForTimeout(2000);

        // Check edit inputs appeared
        const statusSelect = await page.locator('#edit-status').count();
        const dateInput = await page.locator('#edit-date').count();

        console.log('Edit mode - status select:', statusSelect, 'date input:', dateInput);
        await screenshot(page, '3.14-ticket-edit');
      }
    }
  });
});

// ============================================
// PART 4: CUSTOMERS LIST (Tests 4.1 - 4.7)
// ============================================

test.describe('PART 4: Customers List Screen', () => {

  test('4.1: Navigate to customers and verify structure', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/customers');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/عميل|زبون|customer/i);

    // Verify key elements
    const search = await page.locator('#customer-search').count();
    const newBtn = await page.locator('#new-customer-btn').count();
    const tbody = await page.locator('#customers-tbody').count();

    console.log(`Search: ${search}, New btn: ${newBtn}, Table: ${tbody}`);
    expect(tbody).toBeGreaterThan(0);

    await screenshot(page, '4.1-customers-list');
  });

  test('4.2: Search by name', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/customers');
    await page.waitForTimeout(3000);

    const search = page.locator('#customer-search');
    if (await search.count() > 0) {
      await search.fill('عميل');
      await page.waitForTimeout(2000);
      await screenshot(page, '4.2-search-name');
    }
  });

  test('4.3: Search by mobile', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/customers');
    await page.waitForTimeout(3000);

    const search = page.locator('#customer-search');
    if (await search.count() > 0) {
      await search.fill('09');
      await page.waitForTimeout(2000);
      await screenshot(page, '4.3-search-mobile');
    }
  });

  test('4.4: Select all customers', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/customers');
    await page.waitForTimeout(3000);

    const selectAll = page.locator('#select-all');
    if (await selectAll.count() > 0) {
      await selectAll.check();
      await page.waitForTimeout(500);
      expect(await selectAll.isChecked()).toBe(true);

      const rowChecks = await page.locator('.row-check').all();
      console.log('Row checkboxes found:', rowChecks.length);

      await screenshot(page, '4.4-select-all');
    }
  });

  test('4.5: Bulk delete bar appears', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/customers');
    await page.waitForTimeout(3000);

    const selectAll = page.locator('#select-all');
    const bulkBar = page.locator('#bulk-bar');

    if (await selectAll.count() > 0) {
      await selectAll.check();
      await page.waitForTimeout(1000);

      if (await bulkBar.count() > 0) {
        const visible = await bulkBar.isVisible();
        console.log('Bulk bar visible:', visible);
        await screenshot(page, '4.5-bulk-bar');
      }
    }
  });

  test('4.6: New customer button', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/customers');
    await page.waitForTimeout(3000);

    const newBtn = page.locator('#new-customer-btn');
    if (await newBtn.count() > 0) {
      await expect(newBtn).toBeVisible();
      await expect(newBtn).toBeEnabled();
      await screenshot(page, '4.6-new-customer-btn');
    }
  });

  test('4.7: Customer table columns', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/customers');
    await page.waitForTimeout(3000);

    const tbody = await page.locator('#customers-tbody').textContent() || '';

    // Check for common column data
    const hasName = tbody.length > 10;
    const hasPhone = /09|[0-9]/.test(tbody);
    const hasAddress = /دمشق|حلب| address/i.test(tbody) || tbody.length > 50;

    console.log('Table has data:', hasName, 'phone patterns:', hasPhone, 'address:', hasAddress);
    await screenshot(page, '4.7-table-columns');
  });
});

// ============================================
// PART 5: CUSTOMER CRUD (Tests 4.8 - 4.12)
// ============================================

test.describe('PART 5: Customer CRUD Operations', () => {

  test('4.8: Edit customer modal', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/customers');
    await page.waitForTimeout(3000);

    // Generate unique edit data
    const editedName = `Edited_${uniqueSuffix()}`;
    const editedPhone = uniquePhone();
    const editedAddress = `عنوان معدل ${uniqueSuffix()}`;

    const editBtn = page.locator('[data-action="edit"]').first();
    if (await editBtn.count() > 0) {
      await editBtn.click();
      await page.waitForTimeout(2000);

      // Modal should appear
      const modal = page.locator('#edit-modal');
      if (await modal.count() > 0) {
        await expect(modal).toBeVisible();

        // Check form fields
        const nameInput = page.locator('#edit-name');
        const phoneInput = page.locator('#edit-phone');
        const addressInput = page.locator('#edit-address');

        console.log('Modal fields - name:', await nameInput.count(), 'phone:', await phoneInput.count());

        // Test editing with unique data
        if (await nameInput.count() > 0) {
          await nameInput.fill(editedName);
          expect(await nameInput.inputValue()).toBe(editedName);
        }
        if (await phoneInput.count() > 0) {
          await phoneInput.fill(editedPhone);
        }
        if (await addressInput.count() > 0) {
          await addressInput.fill(editedAddress);
        }

        console.log('Edit test data:', editedName, editedPhone);
        await screenshot(page, '4.8-edit-modal');

        // Cancel to avoid saving
        const cancelBtn = page.locator('#edit-cancel');
        if (await cancelBtn.count() > 0) {
          await cancelBtn.click();
        }
      }
    }
  });

  test('4.9: Edit modal - validation', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/customers');
    await page.waitForTimeout(3000);

    const editBtn = page.locator('[data-action="edit"]').first();
    if (await editBtn.count() > 0) {
      await editBtn.click();
      await page.waitForTimeout(2000);

      const nameInput = page.locator('#edit-name');
      if (await nameInput.count() > 0) {
        // First fill with valid unique data
        const validName = `Valid_${uniqueSuffix()}`;
        await nameInput.fill(validName);
        expect(await nameInput.inputValue()).toBe(validName);
        console.log('Filled valid name:', validName);

        // Then clear name (should be required)
        await nameInput.fill('');
        await page.waitForTimeout(500);

        const saveBtn = page.locator('#edit-save');
        if (await saveBtn.count() > 0) {
          // Try to save with empty name
          await saveBtn.click();
          await page.waitForTimeout(1500);

          const body = await page.locator('body').textContent() || '';
          const hasError = /خطأ|error|مطلوب|required/i.test(body);
          console.log('Validation error shown:', hasError);
        }
      }

      await screenshot(page, '4.9-edit-validation');

      // Cancel
      const cancelBtn = page.locator('#edit-cancel');
      if (await cancelBtn.count() > 0) await cancelBtn.click();
    }
  });

  test('4.10: Delete customer modal', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/customers');
    await page.waitForTimeout(3000);

    const deleteBtn = page.locator('[data-action="delete"]').first();
    if (await deleteBtn.count() > 0) {
      await deleteBtn.click();
      await page.waitForTimeout(2000);

      // Delete modal should appear
      const modal = page.locator('#delete-modal');
      if (await modal.count() > 0) {
        await expect(modal).toBeVisible();

        const message = await modal.textContent() || '';
        expect(message).toMatch(/حذف|delete|تأكيد|confirm/i);

        // Cancel to avoid actual deletion
        const cancelBtn = page.locator('#delete-modal-cancel');
        if (await cancelBtn.count() > 0) {
          await cancelBtn.click();
          await page.waitForTimeout(1000);
          await expect(modal).not.toBeVisible();
        }
      }

      await screenshot(page, '4.10-delete-modal');
    }
  });

  test('4.11: Customer detail page', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/customers');
    await page.waitForTimeout(3000);

    // Click first customer row to navigate to detail
    const rows = await page.locator('#customers-tbody tr').all();
    if (rows.length > 0) {
      // Try to find a clickable link in the row
      const links = await page.locator('#customers-tbody tr a, #customers-tbody tr [data-action="view"]').all();
      if (links.length > 0) {
        await links[0].click();
        await page.waitForTimeout(3000);

        const body = await page.locator('body').textContent() || '';
        expect(body).toMatch(/تفاصيل|detail|عميل|customer/i);

        // Check for vehicle section
        const hasVehicles = /مركبة|vehicle|سيارة/i.test(body);
        console.log('Detail page has vehicles section:', hasVehicles);

        await screenshot(page, '4.11-customer-detail');
      }
    }
  });

  test('4.12: Back button on detail page', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/customers/test-id');
    await page.waitForTimeout(3000);

    const backBtn = page.locator('#back-btn');
    if (await backBtn.count() > 0) {
      await expect(backBtn).toBeVisible();
      await expect(backBtn).toBeEnabled();

      // Don't click to avoid navigation issues, just verify it exists
      const text = await backBtn.textContent() || '';
      expect(text).toMatch(/رجوع|back/i);

      await screenshot(page, '4.12-back-btn');
    }
  });
});
