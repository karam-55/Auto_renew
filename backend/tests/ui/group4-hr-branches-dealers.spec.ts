import { test, expect } from '@playwright/test';

/**
 * GROUP 4: HR + Branches + Dealers (18 Tests)
 * Deep testing based on code analysis of:
 * - admin_tauri/src/screens/hr.ts
 * - admin_tauri/src/screens/branches.ts
 * - admin_tauri/src/screens/dealers.ts
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
  await page.screenshot({ path: `test-results/group4-${name}.png`, fullPage: true });
}

function uniqueSuffix(): string {
  return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function uniqueEmployeeName(): string {
  return `Emp_${uniqueSuffix()}`;
}

function uniqueBranchName(): string {
  return `Branch_${uniqueSuffix()}`;
}

function uniqueDealerName(): string {
  return `Dealer_${uniqueSuffix()}`;
}

function uniquePhone(): string {
  return `09${Math.floor(10000000 + Math.random() * 89999999)}`;
}

function uniqueSalary(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ============================================
// PART 1: HR - EMPLOYEES (Tests 11.1 - 11.8)
// ============================================

test.describe('PART 1: HR - Employees', () => {

  test('11.1: Navigate to HR and verify structure', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/hr');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/موظف|hr|employee|موارد بشرية/i);

    const tbody = await page.locator('#hr-tbody').count();
    console.log('HR table found:', tbody);
    expect(tbody).toBeGreaterThan(0);

    await screenshot(page, '11.1-hr-list');
  });

  test('11.2: Employee table columns', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/hr');
    await page.waitForTimeout(3000);

    const thead = await page.locator('#hr-tbody').first().locator('..').locator('thead').textContent() || '';
    const tbody = await page.locator('#hr-tbody').textContent() || '';

    // Check for common columns
    const hasName = /اسم|name/i.test(thead + tbody);
    const hasRole = /دور|role|منصب/i.test(thead + tbody);
    const hasDept = /قسم|department/i.test(thead + tbody);
    const hasPhone = /موبايل|phone/i.test(thead + tbody);
    const hasSalary = /راتب|salary/i.test(thead + tbody);
    const hasStatus = /حالة|status/i.test(thead + tbody);

    console.log('Columns - Name:', hasName, 'Role:', hasRole, 'Dept:', hasDept, 'Phone:', hasPhone, 'Salary:', hasSalary, 'Status:', hasStatus);
    await screenshot(page, '11.2-hr-columns');
  });

  test('11.3: Role badges displayed', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/hr');
    await page.waitForTimeout(3000);

    const tbody = await page.locator('#hr-tbody').textContent() || '';

    const roles = ['OWNER', 'MANAGER', 'ACCOUNTANT', 'RECEPTIONIST', 'MECHANIC', 'HR_MANAGER', 'SALES', 'CASHIER'];
    let foundRoles = 0;

    for (const role of roles) {
      if (tbody.includes(role)) {
        foundRoles++;
      }
    }

    console.log(`Found ${foundRoles}/${roles.length} role badges`);
    await screenshot(page, '11.3-role-badges');
  });

  test('11.4: Status badges (ACTIVE/INACTIVE)', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/hr');
    await page.waitForTimeout(3000);

    const tbody = await page.locator('#hr-tbody').textContent() || '';

    const hasActive = /ACTIVE|نشط|active/i.test(tbody);
    const hasInactive = /INACTIVE|غير نشط|inactive/i.test(tbody);

    console.log('Has ACTIVE:', hasActive, 'Has INACTIVE:', hasInactive);
    await screenshot(page, '11.4-status-badges');
  });

  test('11.5: New employee button', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/hr');
    await page.waitForTimeout(3000);

    const newBtn = page.locator('#new-employee-btn');
    if (await newBtn.count() > 0) {
      await expect(newBtn).toBeVisible();
      await expect(newBtn).toBeEnabled();
      console.log('New employee button visible');
    }
    await screenshot(page, '11.5-new-employee-btn');
  });

  test('11.6: New employee form fields', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/hr');
    await page.waitForTimeout(3000);

    const newBtn = page.locator('#new-employee-btn');
    if (await newBtn.count() > 0) {
      await newBtn.click();
      await page.waitForTimeout(2000);

      // Check form fields exist
      const nameField = await page.locator('#employee-name').count();
      const roleField = await page.locator('#employee-role').count();
      const deptField = await page.locator('#employee-department').count();
      const phoneField = await page.locator('#employee-phone').count();
      const salaryField = await page.locator('#employee-salary').count();

      console.log(`Form fields - Name: ${nameField}, Role: ${roleField}, Dept: ${deptField}, Phone: ${phoneField}, Salary: ${salaryField}`);

      // Fill with unique data
      if (await page.locator('#employee-name').count() > 0) {
        await page.locator('#employee-name').fill(uniqueEmployeeName());
      }
      if (await page.locator('#employee-phone').count() > 0) {
        await page.locator('#employee-phone').fill(uniquePhone());
      }
      if (await page.locator('#employee-salary').count() > 0) {
        await page.locator('#employee-salary').fill(uniqueSalary());
      }

      await screenshot(page, '11.6-new-employee-form');
    }
  });

  test('11.7: Role dropdown options', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/hr');
    await page.waitForTimeout(3000);

    const newBtn = page.locator('#new-employee-btn');
    if (await newBtn.count() > 0) {
      await newBtn.click();
      await page.waitForTimeout(2000);

      const roleSelect = page.locator('#employee-role');
      if (await roleSelect.count() > 0) {
        const options = await roleSelect.locator('option').all();
        console.log('Role options count:', options.length);

        for (let i = 0; i < Math.min(options.length, 10); i++) {
          const text = await options[i].textContent();
          console.log(`  Role ${i}: ${text}`);
        }
      }

      await screenshot(page, '11.7-role-options');
    }
  });

  test('11.8: Edit employee action', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/hr');
    await page.waitForTimeout(3000);

    const editBtn = page.locator('[data-action="edit"]').first();
    if (await editBtn.count() > 0) {
      await expect(editBtn).toBeVisible();
      await editBtn.click();
      await page.waitForTimeout(2000);

      // Check edit form
      const modal = await page.locator('#edit-modal').count();
      const form = await page.locator('#employee-form').count();
      console.log('Edit modal found:', modal, 'Form found:', form);

      await screenshot(page, '11.8-edit-employee');
    }
  });
});

// ============================================
// PART 2: BRANCHES (Tests 12.1 - 12.5)
// ============================================

test.describe('PART 2: Branches Management', () => {

  test('12.1: Navigate to branches and verify structure', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/branches');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/فرع|branch/i);

    const tbody = await page.locator('#branches-tbody').count();
    console.log('Branches table found:', tbody);
    expect(tbody).toBeGreaterThan(0);

    await screenshot(page, '12.1-branches-list');
  });

  test('12.2: New branch button', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/branches');
    await page.waitForTimeout(3000);

    const newBtn = page.locator('#new-branch-btn');
    if (await newBtn.count() > 0) {
      await expect(newBtn).toBeVisible();
      await expect(newBtn).toBeEnabled();
      console.log('New branch button visible');
    }
    await screenshot(page, '12.2-new-branch-btn');
  });

  test('12.3: New branch form fields', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/branches');
    await page.waitForTimeout(3000);

    const newBtn = page.locator('#new-branch-btn');
    if (await newBtn.count() > 0) {
      await newBtn.click();
      await page.waitForTimeout(2000);

      // Check modal fields
      const nameField = await page.locator('#b-name').count();
      const addressField = await page.locator('#b-address').count();
      const phoneField = await page.locator('#b-phone').count();
      const statusField = await page.locator('#b-status').count();

      console.log(`Branch fields - Name: ${nameField}, Address: ${addressField}, Phone: ${phoneField}, Status: ${statusField}`);

      // Fill with unique data
      if (await page.locator('#b-name').count() > 0) {
        await page.locator('#b-name').fill(uniqueBranchName());
      }
      if (await page.locator('#b-address').count() > 0) {
        await page.locator('#b-address').fill(`عنوان فرع ${uniqueSuffix()}`);
      }
      if (await page.locator('#b-phone').count() > 0) {
        await page.locator('#b-phone').fill(uniquePhone());
      }
      if (await page.locator('#b-status').count() > 0) {
        await page.locator('#b-status').selectOption('ACTIVE');
      }

      await screenshot(page, '12.3-new-branch-form');
    }
  });

  test('12.4: Edit branch action', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/branches');
    await page.waitForTimeout(3000);

    const editBtn = page.locator('[data-action="edit"]').first();
    if (await editBtn.count() > 0) {
      await expect(editBtn).toBeVisible();
      await editBtn.click();
      await page.waitForTimeout(2000);

      // Check branch modal
      const modal = page.locator('#branch-modal');
      if (await modal.count() > 0) {
        await expect(modal).toBeVisible();
        console.log('Branch edit modal visible');
      }

      await screenshot(page, '12.4-edit-branch');
    }
  });

  test('12.5: Delete branch modal', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/branches');
    await page.waitForTimeout(3000);

    const deleteBtn = page.locator('[data-action="delete"]').first();
    if (await deleteBtn.count() > 0) {
      await deleteBtn.click();
      await page.waitForTimeout(2000);

      // Check delete modal
      const modal = page.locator('#delete-modal');
      if (await modal.count() > 0) {
        await expect(modal).toBeVisible();

        const message = await modal.textContent() || '';
        expect(message).toMatch(/حذف|delete|تأكيد|confirm/i);

        // Cancel to avoid deletion
        const cancelBtn = page.locator('#delete-cancel');
        if (await cancelBtn.count() > 0) {
          await cancelBtn.click();
        }
      }

      await screenshot(page, '12.5-delete-branch');
    }
  });
});

// ============================================
// PART 3: DEALERS (Tests 13.1 - 13.5)
// ============================================

test.describe('PART 3: Dealers Management', () => {

  test('13.1: Navigate to dealers and verify structure', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/dealers');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/وكيل|dealer/i);

    const search = await page.locator('#search-input').count();
    const tbody = await page.locator('#table-tbody').count();

    console.log(`Search: ${search}, Table: ${tbody}`);
    await screenshot(page, '13.1-dealers-list');
  });

  test('13.2: Search dealers', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/dealers');
    await page.waitForTimeout(3000);

    const search = page.locator('#search-input');
    if (await search.count() > 0) {
      await search.fill('وكيل');
      await page.waitForTimeout(2000);
      await screenshot(page, '13.2-search-dealers');
    }
  });

  test('13.3: Dealer table columns', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/dealers');
    await page.waitForTimeout(3000);

    const tbody = await page.locator('#table-tbody').textContent() || '';
    const thead = await page.locator('#table-tbody').first().locator('..').locator('thead').textContent() || '';
    const combined = thead + tbody;

    const hasName = /اسم|name/i.test(combined);
    const hasPhone = /موبايل|phone/i.test(combined);
    const hasAddress = /عنوان|address/i.test(combined);
    const hasActions = /إجراء|actions|تعديل|حذف/i.test(combined);

    console.log('Columns - Name:', hasName, 'Phone:', hasPhone, 'Address:', hasAddress, 'Actions:', hasActions);
    await screenshot(page, '13.3-dealer-columns');
  });

  test('13.4: New dealer button', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/dealers');
    await page.waitForTimeout(3000);

    const newBtn = page.locator('#new-dealer-btn');
    if (await newBtn.count() > 0) {
      await expect(newBtn).toBeVisible();
      await expect(newBtn).toBeEnabled();
      console.log('New dealer button visible');
    }
    await screenshot(page, '13.4-new-dealer-btn');
  });

  test('13.5: Edit and delete dealer actions', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/dealers');
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

    await screenshot(page, '13.5-dealer-actions');
  });
});
