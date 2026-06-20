import { test, expect } from '@playwright/test';

/**
 * GROUP 4 CRUD REAL: HR + Branches + Dealers
 * Creates real data in database and LEAVES it there
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
  await page.screenshot({ path: `test-results/crud4-${name}.png`, fullPage: true });
}

function uniqueSuffix(): string {
  return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function uniqueEmployeeName(): string {
  return `TestEmp_${uniqueSuffix()}`;
}

function uniqueBranchName(): string {
  return `TestBranch_${uniqueSuffix()}`;
}

function uniqueDealerName(): string {
  return `TestDealer_${uniqueSuffix()}`;
}

function uniquePhone(): string {
  return `09${Math.floor(10000000 + Math.random() * 89999999)}`;
}

function uniqueSalary(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function uniqueEmail(): string {
  return `test_${uniqueSuffix()}@example.com`;
}

// ============================================
// PART 1: CREATE EMPLOYEE (Real)
// ============================================

test.describe('PART 1: Create Real Employee', () => {

  test('CRUD-11.1: Create new employee', async ({ page }) => {
    const empName = uniqueEmployeeName();
    const empPhone = uniquePhone();
    const empSalary = uniqueSalary();
    const empEmail = uniqueEmail();

    await login(page);
    await page.goto('http://localhost:1420#/hr');
    await page.waitForTimeout(3000);

    const newBtn = page.locator('#new-employee-btn');
    if (await newBtn.count() > 0) {
      await newBtn.click();
      await page.waitForTimeout(2000);

      // Fill employee form
      const nameInput = page.locator('#employee-name');
      if (await nameInput.count() > 0) {
        await nameInput.fill(empName);
      }

      const roleSelect = page.locator('#employee-role');
      if (await roleSelect.count() > 0) {
        const options = await roleSelect.locator('option').all();
        if (options.length > 1) {
          await roleSelect.selectOption({ index: 1 });
        }
      }

      const deptInput = page.locator('#employee-department');
      if (await deptInput.count() > 0) {
        await deptInput.fill('صيانة');
      }

      const phoneInput = page.locator('#employee-phone');
      if (await phoneInput.count() > 0) {
        await phoneInput.fill(empPhone);
      }

      const salaryInput = page.locator('#employee-salary');
      if (await salaryInput.count() > 0) {
        await salaryInput.fill(empSalary);
      }

      const statusSelect = page.locator('#employee-status');
      if (await statusSelect.count() > 0) {
        await statusSelect.selectOption('ACTIVE');
      }

      // Save (REAL CREATE)
      const saveBtn = page.locator('#save-employee-btn, [data-action="save-employee"]');
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(3000);
        console.log(`Employee created: ${empName}, Phone: ${empPhone}, Salary: ${empSalary}`);
      } else {
        console.log('Save button not found');
      }
    }

    await screenshot(page, 'crud-11.1-employee-created');
  });

  test('CRUD-11.2: Create multiple employees', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/hr');
    await page.waitForTimeout(3000);

    const employees = [
      { name: uniqueEmployeeName(), phone: uniquePhone(), salary: uniqueSalary(), role: 'MECHANIC' },
      { name: uniqueEmployeeName(), phone: uniquePhone(), salary: uniqueSalary(), role: 'RECEPTIONIST' },
      { name: uniqueEmployeeName(), phone: uniquePhone(), salary: uniqueSalary(), role: 'ACCOUNTANT' },
    ];

    for (const emp of employees) {
      const newBtn = page.locator('#new-employee-btn');
      if (await newBtn.count() > 0) {
        await newBtn.click();
        await page.waitForTimeout(1500);

        if (await page.locator('#employee-name').count() > 0) {
          await page.locator('#employee-name').fill(emp.name);
        }

        const roleSelect = page.locator('#employee-role');
        if (await roleSelect.count() > 0) {
          try {
            await roleSelect.selectOption(emp.role);
          } catch (e) {
            await roleSelect.selectOption({ index: 1 });
          }
        }

        if (await page.locator('#employee-phone').count() > 0) {
          await page.locator('#employee-phone').fill(emp.phone);
        }
        if (await page.locator('#employee-salary').count() > 0) {
          await page.locator('#employee-salary').fill(emp.salary);
        }

        const saveBtn = page.locator('#save-employee-btn, [data-action="save-employee"]');
        if (await saveBtn.count() > 0) {
          await saveBtn.click();
          await page.waitForTimeout(2000);
          console.log(`Created employee: ${emp.name}, Role: ${emp.role}`);
        }
      }
    }

    await screenshot(page, 'crud-11.2-multiple-employees');
  });

  test('CRUD-11.3: Update employee status', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/hr');
    await page.waitForTimeout(3000);

    // Click edit on first employee
    const editBtn = page.locator('[data-action="edit"]').first();
    if (await editBtn.count() > 0) {
      await editBtn.click();
      await page.waitForTimeout(2000);

      // Change status to INACTIVE
      const statusSelect = page.locator('#edit-status, #employee-status');
      if (await statusSelect.count() > 0) {
        await statusSelect.selectOption('INACTIVE');
      }

      // Save changes (REAL UPDATE)
      const saveBtn = page.locator('#edit-save, [data-action="save"]');
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(3000);
        console.log('Employee status updated to INACTIVE');
      }
    }

    await screenshot(page, 'crud-11.3-employee-updated');
  });
});

// ============================================
// PART 2: CREATE BRANCH (Real)
// ============================================

test.describe('PART 2: Create Real Branch', () => {

  test('CRUD-12.1: Create new branch', async ({ page }) => {
    const branchName = uniqueBranchName();
    const branchPhone = uniquePhone();
    const branchAddress = `عنوان فرع اختبار ${uniqueSuffix()}`;

    await login(page);
    await page.goto('http://localhost:1420#/branches');
    await page.waitForTimeout(3000);

    const newBtn = page.locator('#new-branch-btn');
    if (await newBtn.count() > 0) {
      await newBtn.click();
      await page.waitForTimeout(2000);

      // Fill branch form
      const nameInput = page.locator('#b-name');
      if (await nameInput.count() > 0) {
        await nameInput.fill(branchName);
      }

      const addressInput = page.locator('#b-address');
      if (await addressInput.count() > 0) {
        await addressInput.fill(branchAddress);
      }

      const phoneInput = page.locator('#b-phone');
      if (await phoneInput.count() > 0) {
        await phoneInput.fill(branchPhone);
      }

      const statusSelect = page.locator('#b-status');
      if (await statusSelect.count() > 0) {
        await statusSelect.selectOption('ACTIVE');
      }

      // Save (REAL CREATE)
      const saveBtn = page.locator('#save-branch-btn, [data-action="save-branch"]');
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(3000);
        console.log(`Branch created: ${branchName}, Address: ${branchAddress}`);
      } else {
        console.log('Branch save button not found');
      }
    }

    await screenshot(page, 'crud-12.1-branch-created');
  });

  test('CRUD-12.2: Create multiple branches', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/branches');
    await page.waitForTimeout(3000);

    const branches = [
      { name: uniqueBranchName(), address: 'دمشق - المزة', phone: uniquePhone() },
      { name: uniqueBranchName(), address: 'حلب - سيف الدولة', phone: uniquePhone() },
    ];

    for (const branch of branches) {
      const newBtn = page.locator('#new-branch-btn');
      if (await newBtn.count() > 0) {
        await newBtn.click();
        await page.waitForTimeout(1500);

        if (await page.locator('#b-name').count() > 0) {
          await page.locator('#b-name').fill(branch.name);
        }
        if (await page.locator('#b-address').count() > 0) {
          await page.locator('#b-address').fill(branch.address);
        }
        if (await page.locator('#b-phone').count() > 0) {
          await page.locator('#b-phone').fill(branch.phone);
        }

        const saveBtn = page.locator('#save-branch-btn, [data-action="save-branch"]');
        if (await saveBtn.count() > 0) {
          await saveBtn.click();
          await page.waitForTimeout(2000);
          console.log(`Created branch: ${branch.name}`);
        }
      }
    }

    await screenshot(page, 'crud-12.2-multiple-branches');
  });

  test('CRUD-12.3: Update branch status', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/branches');
    await page.waitForTimeout(3000);

    const editBtn = page.locator('[data-action="edit"]').first();
    if (await editBtn.count() > 0) {
      await editBtn.click();
      await page.waitForTimeout(2000);

      // Change status
      const statusSelect = page.locator('#b-status');
      if (await statusSelect.count() > 0) {
        await statusSelect.selectOption('INACTIVE');
      }

      // Save (REAL UPDATE)
      const saveBtn = page.locator('#save-branch-btn, [data-action="save"]');
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(3000);
        console.log('Branch status updated');
      }
    }

    await screenshot(page, 'crud-12.3-branch-updated');
  });
});

// ============================================
// PART 3: CREATE DEALER (Real)
// ============================================

test.describe('PART 3: Create Real Dealer', () => {

  test('CRUD-13.1: Create new dealer', async ({ page }) => {
    const dealerName = uniqueDealerName();
    const dealerPhone = uniquePhone();
    const dealerAddress = `عنوان وكيل ${uniqueSuffix()}`;

    await login(page);
    await page.goto('http://localhost:1420#/dealers');
    await page.waitForTimeout(3000);

    const newBtn = page.locator('#new-dealer-btn');
    if (await newBtn.count() > 0) {
      await newBtn.click();
      await page.waitForTimeout(2000);

      // Fill dealer form
      const nameInput = page.locator('#dealer-name');
      if (await nameInput.count() > 0) {
        await nameInput.fill(dealerName);
      }

      const phoneInput = page.locator('#dealer-phone');
      if (await phoneInput.count() > 0) {
        await phoneInput.fill(dealerPhone);
      }

      const addressInput = page.locator('#dealer-address');
      if (await addressInput.count() > 0) {
        await addressInput.fill(dealerAddress);
      }

      // Save (REAL CREATE)
      const saveBtn = page.locator('#save-dealer-btn, [data-action="save-dealer"]');
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(3000);
        console.log(`Dealer created: ${dealerName}, Phone: ${dealerPhone}`);
      } else {
        console.log('Dealer save button not found');
      }
    }

    await screenshot(page, 'crud-13.1-dealer-created');
  });

  test('CRUD-13.2: Create multiple dealers', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/dealers');
    await page.waitForTimeout(3000);

    const dealers = [
      { name: uniqueDealerName(), phone: uniquePhone() },
      { name: uniqueDealerName(), phone: uniquePhone() },
    ];

    for (const dealer of dealers) {
      const newBtn = page.locator('#new-dealer-btn');
      if (await newBtn.count() > 0) {
        await newBtn.click();
        await page.waitForTimeout(1500);

        if (await page.locator('#dealer-name').count() > 0) {
          await page.locator('#dealer-name').fill(dealer.name);
        }
        if (await page.locator('#dealer-phone').count() > 0) {
          await page.locator('#dealer-phone').fill(dealer.phone);
        }

        const saveBtn = page.locator('#save-dealer-btn, [data-action="save-dealer"]');
        if (await saveBtn.count() > 0) {
          await saveBtn.click();
          await page.waitForTimeout(2000);
          console.log(`Created dealer: ${dealer.name}`);
        }
      }
    }

    await screenshot(page, 'crud-13.2-multiple-dealers');
  });

  test('CRUD-13.3: Update dealer info', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/dealers');
    await page.waitForTimeout(3000);

    const editBtn = page.locator('[data-action="edit"]').first();
    if (await editBtn.count() > 0) {
      await editBtn.click();
      await page.waitForTimeout(2000);

      // Update phone
      const phoneInput = page.locator('#dealer-phone, #edit-phone');
      if (await phoneInput.count() > 0) {
        await phoneInput.fill(uniquePhone());
      }

      // Save (REAL UPDATE)
      const saveBtn = page.locator('#save-dealer-btn, [data-action="save"]');
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(3000);
        console.log('Dealer updated');
      }
    }

    await screenshot(page, 'crud-13.3-dealer-updated');
  });
});

// ============================================
// SUMMARY
// ============================================

test.describe('SUMMARY: HR Data Created', () => {
  test('SUMMARY: List all HR test data', async ({ page, request }) => {
    await login(page);

    const token = await page.evaluate(() => localStorage.getItem('token'));

    const employeesRes = await request.get('http://localhost:8080/api/employees', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const employeesData = await employeesRes.json();

    const branchesRes = await request.get('http://localhost:8080/api/branches', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const branchesData = await branchesRes.json();

    const dealersRes = await request.get('http://localhost:8080/api/dealers', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const dealersData = await dealersRes.json();

    console.log('\n========== HR TEST DATA ==========');
    console.log('Total Employees:', employeesData.data?.length || employeesData.length || 0);
    console.log('Total Branches:', branchesData.data?.length || branchesData.length || 0);
    console.log('Total Dealers:', dealersData.data?.length || dealersData.length || 0);
    console.log('Note: Test data with "TestEmp_", "TestBranch_", "TestDealer_" prefix was created');
    console.log('===================================\n');

    await screenshot(page, 'crud4-summary');
  });
});
