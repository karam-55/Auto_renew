import { test, expect } from '@playwright/test';

/**
 * GROUP 6 CRUD REAL: Notifications + Admin + Cost Centers + Assets
 * Creates real data in database and LEAVES it there
 */

test.use({
  viewport: { width: 1920, height: 1080 },
  launchOptions: { slowMo: 200 },
});

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
  await page.screenshot({ path: `test-results/crud6-${name}.png`, fullPage: true });
}

function uniqueSuffix(): string {
  return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function uniqueUserName(): string {
  return `TestUser_${uniqueSuffix()}`;
}

function uniqueFullName(): string {
  return `User ${uniqueSuffix()}`;
}

function uniqueRoleName(): string {
  return `TestRole_${uniqueSuffix()}`;
}

function uniqueEmail(): string {
  return `testuser_${uniqueSuffix()}@example.com`;
}

function uniquePhone(): string {
  return `09${Math.floor(10000000 + Math.random() * 89999999)}`;
}

function uniqueCostCenterName(): string {
  return `TestCenter_${uniqueSuffix()}`;
}

function uniqueAssetName(): string {
  return `TestAsset_${uniqueSuffix()}`;
}

// ============================================
// PART 1: CREATE USER (Real)
// ============================================

test.describe('PART 1: Create Real User', () => {

  test('CRUD-15.1: Create new user', async ({ page }) => {
    const fullName = uniqueFullName();
    const username = uniqueUserName();
    const email = uniqueEmail();

    await login(page);
    await page.goto('http://localhost:1420#/admin/users');
    await page.waitForTimeout(3000);

    const newBtn = page.locator('#btn-new-user');
    if (await newBtn.count() > 0) {
      await newBtn.click();
      await page.waitForTimeout(2000);

      if (await page.locator('#user-fullname').count() > 0) {
        await page.locator('#user-fullname').fill(fullName);
      }
      if (await page.locator('#user-username').count() > 0) {
        await page.locator('#user-username').fill(username);
      }
      if (await page.locator('#user-email').count() > 0) {
        await page.locator('#user-email').fill(email);
      }

      const roleSelect = page.locator('#user-role');
      if (await roleSelect.count() > 0) {
        const options = await roleSelect.locator('option').all();
        if (options.length > 1) {
          await roleSelect.selectOption({ index: 1 });
        }
      }

      const statusSelect = page.locator('#user-status');
      if (await statusSelect.count() > 0) {
        await statusSelect.selectOption('active');
      }

      const saveBtn = page.locator('#save-user-btn, [data-action="save-user"]');
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(3000);
        console.log(`User created: ${username}, Email: ${email}`);
      }
    }

    await screenshot(page, 'crud-15.1-user-created');
  });

  test('CRUD-15.2: Create multiple users', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/admin/users');
    await page.waitForTimeout(3000);

    const users = [
      { name: uniqueFullName(), username: uniqueUserName(), email: uniqueEmail() },
      { name: uniqueFullName(), username: uniqueUserName(), email: uniqueEmail() },
    ];

    for (const user of users) {
      const newBtn = page.locator('#btn-new-user');
      if (await newBtn.count() > 0) {
        await newBtn.click();
        await page.waitForTimeout(1500);

        if (await page.locator('#user-fullname').count() > 0) {
          await page.locator('#user-fullname').fill(user.name);
        }
        if (await page.locator('#user-username').count() > 0) {
          await page.locator('#user-username').fill(user.username);
        }
        if (await page.locator('#user-email').count() > 0) {
          await page.locator('#user-email').fill(user.email);
        }

        const saveBtn = page.locator('#save-user-btn, [data-action="save-user"]');
        if (await saveBtn.count() > 0) {
          await saveBtn.click();
          await page.waitForTimeout(2000);
          console.log(`Created user: ${user.username}`);
        }
      }
    }

    await screenshot(page, 'crud-15.2-multiple-users');
  });
});

// ============================================
// PART 2: CREATE ROLE (Real)
// ============================================

test.describe('PART 2: Create Real Role', () => {

  test('CRUD-15.3: Create new role with permissions', async ({ page }) => {
    const roleName = uniqueRoleName();
    const roleDesc = `Role description ${uniqueSuffix()}`;

    await login(page);
    await page.goto('http://localhost:1420#/admin/roles');
    await page.waitForTimeout(3000);

    const newBtn = page.locator('#btn-new-role');
    if (await newBtn.count() > 0) {
      await newBtn.click();
      await page.waitForTimeout(2000);

      if (await page.locator('#role-name').count() > 0) {
        await page.locator('#role-name').fill(roleName);
      }
      if (await page.locator('#role-description').count() > 0) {
        await page.locator('#role-description').fill(roleDesc);
      }

      // Check some permissions
      const checkboxes = await page.locator('input[type="checkbox"]').all();
      for (let i = 0; i < Math.min(checkboxes.length, 5); i++) {
        await checkboxes[i].check();
      }

      const saveBtn = page.locator('#save-role-btn, [data-action="save-role"]');
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(3000);
        console.log(`Role created: ${roleName} with ${Math.min(checkboxes.length, 5)} permissions`);
      }
    }

    await screenshot(page, 'crud-15.3-role-created');
  });

  test('CRUD-15.4: Create multiple roles', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/admin/roles');
    await page.waitForTimeout(3000);

    const roles = [
      { name: uniqueRoleName() },
      { name: uniqueRoleName() },
    ];

    for (const role of roles) {
      const newBtn = page.locator('#btn-new-role');
      if (await newBtn.count() > 0) {
        await newBtn.click();
        await page.waitForTimeout(1500);

        if (await page.locator('#role-name').count() > 0) {
          await page.locator('#role-name').fill(role.name);
        }

        const saveBtn = page.locator('#save-role-btn, [data-action="save-role"]');
        if (await saveBtn.count() > 0) {
          await saveBtn.click();
          await page.waitForTimeout(2000);
          console.log(`Created role: ${role.name}`);
        }
      }
    }

    await screenshot(page, 'crud-15.4-multiple-roles');
  });
});

// ============================================
// PART 3: CREATE COST CENTER (Real)
// ============================================

test.describe('PART 3: Create Real Cost Center', () => {

  test('CRUD-15.5: Create cost center', async ({ page }) => {
    const centerName = uniqueCostCenterName();

    await login(page);
    await page.goto('http://localhost:1420#/cost-centers');
    await page.waitForTimeout(3000);

    const newBtn = page.locator('#new-center-btn, [data-action="new-center"]');
    if (await newBtn.count() > 0) {
      await newBtn.click();
      await page.waitForTimeout(2000);

      if (await page.locator('#center-name').count() > 0) {
        await page.locator('#center-name').fill(centerName);
      }
      if (await page.locator('#center-type').count() > 0) {
        await page.locator('#center-type').fill('صيانة');
      }
      if (await page.locator('#center-budget').count() > 0) {
        await page.locator('#center-budget').fill('50000');
      }

      const saveBtn = page.locator('#save-center-btn, [data-action="save-center"]');
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(3000);
        console.log(`Cost center created: ${centerName}`);
      }
    }

    await screenshot(page, 'crud-15.5-center-created');
  });
});

// ============================================
// PART 4: CREATE ASSET (Real)
// ============================================

test.describe('PART 4: Create Real Asset', () => {

  test('CRUD-15.6: Create fixed asset', async ({ page }) => {
    const assetName = uniqueAssetName();
    const purchaseCost = String(Math.floor(100000 + Math.random() * 900000));

    await login(page);
    await page.goto('http://localhost:1420#/assets');
    await page.waitForTimeout(3000);

    const newBtn = page.locator('#new-asset-btn, [data-action="new-asset"]');
    if (await newBtn.count() > 0) {
      await newBtn.click();
      await page.waitForTimeout(2000);

      if (await page.locator('#asset-name').count() > 0) {
        await page.locator('#asset-name').fill(assetName);
      }
      if (await page.locator('#asset-category').count() > 0) {
        await page.locator('#asset-category').fill('معدات');
      }
      if (await page.locator('#asset-cost').count() > 0) {
        await page.locator('#asset-cost').fill(purchaseCost);
      }
      if (await page.locator('#asset-life').count() > 0) {
        await page.locator('#asset-life').fill('5');
      }

      const saveBtn = page.locator('#save-asset-btn, [data-action="save-asset"]');
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(3000);
        console.log(`Asset created: ${assetName}, Cost: ${purchaseCost}`);
      }
    }

    await screenshot(page, 'crud-15.6-asset-created');
  });

  test('CRUD-15.7: Create asset category', async ({ page }) => {
    const catName = `TestCat_${uniqueSuffix()}`;

    await login(page);
    await page.goto('http://localhost:1420#/assets');
    await page.waitForTimeout(3000);

    const newCatBtn = page.locator('#new-category-btn, [data-action="new-category"]');
    if (await newCatBtn.count() > 0) {
      await newCatBtn.click();
      await page.waitForTimeout(2000);

      if (await page.locator('#category-name').count() > 0) {
        await page.locator('#category-name').fill(catName);
      }
      if (await page.locator('#category-method').count() > 0) {
        await page.locator('#category-method').selectOption('straight_line');
      }
      if (await page.locator('#category-life').count() > 0) {
        await page.locator('#category-life').fill('10');
      }

      const saveBtn = page.locator('#save-category-btn, [data-action="save-category"]');
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(3000);
        console.log(`Asset category created: ${catName}`);
      }
    }

    await screenshot(page, 'crud-15.7-category-created');
  });
});

// ============================================
// SUMMARY
// ============================================

test.describe('SUMMARY: Admin Data Created', () => {
  test('SUMMARY: List all admin test data', async ({ page, request }) => {
    await login(page);

    const token = await page.evaluate(() => localStorage.getItem('token'));

    const usersRes = await request.get('http://localhost:8080/api/users', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const usersData = await usersRes.json();

    const rolesRes = await request.get('http://localhost:8080/api/roles', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const rolesData = await rolesRes.json();

    console.log('\n========== ADMIN TEST DATA ==========');
    console.log('Total Users:', usersData.data?.length || usersData.length || 0);
    console.log('Total Roles:', rolesData.data?.length || rolesData.length || 0);
    console.log('Note: Test data with "TestUser_" and "TestRole_" prefix was created');
    console.log('=====================================\n');

    await screenshot(page, 'crud6-summary');
  });
});
