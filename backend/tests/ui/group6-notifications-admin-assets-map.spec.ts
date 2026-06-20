import { test, expect } from '@playwright/test';

/**
 * GROUP 6: Notifications + Admin + Cost Centers + Assets + Workshop Map (38 Tests)
 * Based on code analysis of:
 * - admin_tauri/src/screens/notifications.ts
 * - admin_tauri/src/screens/documents.ts
 * - admin_tauri/src/screens/admin.ts
 * - admin_tauri/src/screens/users.ts
 * - admin_tauri/src/screens/roles.ts
 * - admin_tauri/src/screens/audit.ts
 * - admin_tauri/src/screens/settings.ts
 * - admin_tauri/src/screens/cost-centers.ts
 * - admin_tauri/src/screens/assets.ts
 * - admin_tauri/src/screens/workshop-map.ts
 */

test.use({
  viewport: { width: 1920, height: 1080 },
  launchOptions: { slowMo: 120 },
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
  await page.screenshot({ path: `test-results/group6-${name}.png`, fullPage: true });
}

function uniqueSuffix(): string {
  return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function uniqueUserName(): string {
  return `TestUser_${uniqueSuffix()}`;
}

function uniqueRoleName(): string {
  return `TestRole_${uniqueSuffix()}`;
}

// ============================================
// PART 1: NOTIFICATIONS (Tests 14.1 - 14.8)
// ============================================

test.describe('PART 1: Notifications', () => {

  test('14.1: Navigate to notifications', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/notifications');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/تنبيه|notification|alert/i);

    const tabs = await page.locator('#notif-tabs').count();
    console.log('Notification tabs found:', tabs);
    await screenshot(page, '14.1-notifications-page');
  });

  test('14.2: System alerts tab', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/notifications');
    await page.waitForTimeout(3000);

    const alertsTab = page.locator('#tab-alerts, [data-tab="alerts"]');
    if (await alertsTab.count() > 0) {
      await alertsTab.click();
      await page.waitForTimeout(1500);

      const panel = await page.locator('#alerts-panel').count();
      console.log('Alerts panel found:', panel);
    }
    await screenshot(page, '14.2-alerts-tab');
  });

  test('14.3: Scheduled tasks tab', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/notifications');
    await page.waitForTimeout(3000);

    const tasksTab = page.locator('#tab-tasks, [data-tab="tasks"]');
    if (await tasksTab.count() > 0) {
      await tasksTab.click();
      await page.waitForTimeout(1500);

      const panel = await page.locator('#tasks-panel').count();
      console.log('Tasks panel found:', panel);
    }
    await screenshot(page, '14.3-tasks-tab');
  });

  test('14.4: Team chat tab', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/notifications');
    await page.waitForTimeout(3000);

    const chatTab = page.locator('#tab-chat, [data-tab="chat"]');
    if (await chatTab.count() > 0) {
      await chatTab.click();
      await page.waitForTimeout(1500);

      const panel = await page.locator('#chat-panel').count();
      console.log('Chat panel found:', panel);
    }
    await screenshot(page, '14.4-chat-tab');
  });

  test('14.5: Filter all alerts', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/notifications');
    await page.waitForTimeout(3000);

    const filterAll = page.locator('#filter-all');
    if (await filterAll.count() > 0) {
      await filterAll.click();
      await page.waitForTimeout(1000);
      console.log('All filter clicked');
    }
    await screenshot(page, '14.5-filter-all');
  });

  test('14.6: Filter high importance', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/notifications');
    await page.waitForTimeout(3000);

    const filterHigh = page.locator('#filter-high');
    if (await filterHigh.count() > 0) {
      await filterHigh.click();
      await page.waitForTimeout(1000);
      console.log('High importance filter clicked');
    }
    await screenshot(page, '14.6-filter-high');
  });

  test('14.7: Filter read', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/notifications');
    await page.waitForTimeout(3000);

    const filterRead = page.locator('#filter-read');
    if (await filterRead.count() > 0) {
      if (await filterRead.isVisible()) {
        await filterRead.click();
        await page.waitForTimeout(1000);
        console.log('Read filter clicked');
      } else {
        console.log('Read filter found but hidden on this viewport');
      }
    } else {
      console.log('Read filter button not found');
    }
    await screenshot(page, '14.7-filter-read');
  });

  test('14.8: Mark all as read button', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/notifications');
    await page.waitForTimeout(3000);

    const markBtn = page.locator('#mark-all-read');
    if (await markBtn.count() > 0) {
      await expect(markBtn).toBeVisible();
      await expect(markBtn).toBeEnabled();
      console.log('Mark all read button visible');
    }
    await screenshot(page, '14.8-mark-all-read');
  });
});

// ============================================
// PART 2: DOCUMENTS (Tests 14.9 - 14.11)
// ============================================

test.describe('PART 2: Documents', () => {

  test('14.9: Navigate to documents', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/documents');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/مستند|document|archive/i);

    const categories = [
      /فاتورة|invoice/i,
      /عقد|contract/i,
      /طلب|order/i,
      /صورة|image/i,
    ];

    let found = 0;
    for (const c of categories) {
      if (c.test(body)) found++;
    }
    console.log(`Document categories found: ${found}/${categories.length}`);
    await screenshot(page, '14.9-documents-page');
  });

  test('14.10: Document counts displayed', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/documents');
    await page.waitForTimeout(3000);

    const countIds = ['#doc-count-invoices', '#doc-count-contracts', '#doc-count-orders', '#doc-count-images'];
    for (const id of countIds) {
      const count = await page.locator(id).count();
      console.log(`  ${id}: ${count > 0 ? 'found' : 'missing'}`);
    }

    await screenshot(page, '14.10-doc-counts');
  });

  test('14.11: Upload document button', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/documents');
    await page.waitForTimeout(3000);

    const uploadBtn = page.locator('#upload-doc-btn, [data-action="upload"]');
    if (await uploadBtn.count() > 0) {
      await expect(uploadBtn).toBeVisible();
      console.log('Upload button visible');
    }
    await screenshot(page, '14.11-upload-btn');
  });
});

// ============================================
// PART 3: ADMIN HUB (Tests 15.1)
// ============================================

test.describe('PART 3: Admin Hub', () => {

  test('15.1: Navigate to admin hub', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/admin');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/إدارة|admin|أمان|security/i);

    const cards = [
      /مستخدم|user/i,
      /صلاحية|role|permission/i,
      /تدقيق|audit/i,
      /إعداد|setting/i,
    ];

    let found = 0;
    for (const c of cards) {
      if (c.test(body)) found++;
    }
    console.log(`Admin cards found: ${found}/${cards.length}`);
    await screenshot(page, '15.1-admin-hub');
  });
});

// ============================================
// PART 4: USERS (Tests 15.2 - 15.8)
// ============================================

test.describe('PART 4: Users Management', () => {

  test('15.2: Navigate to users', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/admin/users');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/مستخدم|user/i);

    const kpiIds = ['#kpi-total-users', '#kpi-active-users'];
    for (const id of kpiIds) {
      const count = await page.locator(id).count();
      console.log(`  ${id}: ${count > 0 ? 'found' : 'missing'}`);
    }

    await screenshot(page, '15.2-users-page');
  });

  test('15.3: New user button', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/admin/users');
    await page.waitForTimeout(3000);

    const btn = page.locator('#btn-new-user');
    if (await btn.count() > 0) {
      await expect(btn).toBeVisible();
      await expect(btn).toBeEnabled();
      console.log('New user button visible');
    }
    await screenshot(page, '15.3-new-user-btn');
  });

  test('15.4: New user form fields', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/admin/users');
    await page.waitForTimeout(3000);

    const btn = page.locator('#btn-new-user');
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(2000);

      const fullName = await page.locator('#user-fullname').count();
      const username = await page.locator('#user-username').count();
      const email = await page.locator('#user-email').count();
      const role = await page.locator('#user-role').count();
      const status = await page.locator('#user-status').count();

      console.log(`Fields - FullName: ${fullName}, Username: ${username}, Email: ${email}, Role: ${role}, Status: ${status}`);
      await screenshot(page, '15.4-new-user-form');
    }
  });

  test('15.5: Role dropdown in user form', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/admin/users');
    await page.waitForTimeout(3000);

    const btn = page.locator('#btn-new-user');
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(2000);

      const roleSelect = page.locator('#user-role');
      if (await roleSelect.count() > 0) {
        const options = await roleSelect.locator('option').all();
        console.log('Role options:', options.length);
        for (let i = 0; i < Math.min(options.length, 5); i++) {
          const text = await options[i].textContent();
          console.log(`  ${i}: ${text}`);
        }
      }
      await screenshot(page, '15.5-role-dropdown');
    }
  });

  test('15.6: Users table', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/admin/users');
    await page.waitForTimeout(3000);

    // Use generic table selector since ID may vary
    const table = page.locator('table').first();
    if (await table.count() > 0) {
      const tbody = await table.textContent() || '';
      console.log('Users table length:', tbody.length);
    } else {
      console.log('No table found on users page');
    }
    await screenshot(page, '15.6-users-table');
  });

  test('15.7: Edit user action', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/admin/users');
    await page.waitForTimeout(3000);

    const editBtn = page.locator('[data-action="edit"]').first();
    if (await editBtn.count() > 0) {
      await expect(editBtn).toBeVisible();
      console.log('Edit user button visible');
    }
    await screenshot(page, '15.7-edit-user');
  });

  test('15.8: Delete user modal', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/admin/users');
    await page.waitForTimeout(3000);

    const deleteBtn = page.locator('[data-action="delete"]').first();
    if (await deleteBtn.count() > 0) {
      await deleteBtn.click();
      await page.waitForTimeout(2000);

      const modal = page.locator('#delete-modal');
      if (await modal.count() > 0) {
        await expect(modal).toBeVisible();

        const cancelBtn = page.locator('#delete-modal-cancel');
        if (await cancelBtn.count() > 0) {
          await cancelBtn.click();
        }
      }
      await screenshot(page, '15.8-delete-user');
    }
  });
});

// ============================================
// PART 5: ROLES (Tests 15.9 - 15.13)
// ============================================

test.describe('PART 5: Roles & Permissions', () => {

  test('15.9: Navigate to roles', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/admin/roles');
    
    // Wait for roles list container (always visible due to skeleton)
    await page.waitForSelector('#roles-list', { timeout: 15000 });

    const body = await page.locator('body').textContent() || '';

    expect(body).toMatch(/صلاحيات|صلاحية|role|permission/i);

    // Check for any list container
    const list = await page.locator('#roles-list').count();
    console.log('Roles list found:', list);
    await screenshot(page, '15.9-roles-page');
  });

  test('15.10: New role button', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/admin/roles');
    await page.waitForTimeout(3000);

    const btn = page.locator('#btn-new-role');
    if (await btn.count() > 0) {
      await expect(btn).toBeVisible();
      await btn.click();
      await page.waitForTimeout(2000);
      console.log('New role form opened');
    }
    await screenshot(page, '15.10-new-role-btn');
  });

  test('15.11: Role form fields', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/admin/roles');
    await page.waitForTimeout(3000);

    const btn = page.locator('#btn-new-role');
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(2000);

      const nameField = await page.locator('#role-name').count();
      const descField = await page.locator('#role-description').count();
      const perms = await page.locator('#role-permissions').count();

      console.log(`Fields - Name: ${nameField}, Desc: ${descField}, Permissions: ${perms}`);
      await screenshot(page, '15.11-role-form');
    }
  });

  test('15.12: Permissions checkboxes', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/admin/roles');
    await page.waitForTimeout(3000);

    const btn = page.locator('#btn-new-role');
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(2000);

      const checkboxes = await page.locator('input[type="checkbox"]').all();
      console.log('Permission checkboxes found:', checkboxes.length);
      await screenshot(page, '15.12-permissions');
    }
  });

  test('15.13: Existing roles list', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/admin/roles');
    await page.waitForTimeout(3000);

    const rolesList = await page.locator('#roles-list').textContent() || '';
    const roles = ['OWNER', 'MANAGER', 'ADMIN', 'ACCOUNTANT', 'RECEPTIONIST', 'MECHANIC'];

    let found = 0;
    for (const role of roles) {
      if (rolesList.includes(role)) found++;
    }
    console.log(`Roles found: ${found}/${roles.length}`);
    await screenshot(page, '15.13-roles-list');
  });
});

// ============================================
// PART 6: AUDIT (Tests 15.14 - 15.15)
// ============================================

test.describe('PART 6: Audit Log', () => {

  test('15.14: Navigate to audit', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/admin/audit');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/تدقيق|audit|log/i);

    const tbody = await page.locator('#audit-table-body').count();
    console.log('Audit table found:', tbody);
    await screenshot(page, '15.14-audit-page');
  });

  test('15.15: Audit action filter', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/admin/audit');
    await page.waitForTimeout(3000);

    const filter = page.locator('#audit-action-filter');
    if (await filter.count() > 0) {
      const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN'];
      for (const action of actions) {
        try {
          await filter.selectOption(action);
          await page.waitForTimeout(1500);
          console.log(`Filtered by action: ${action}`);
        } catch (e) {
          console.log(`Action ${action} not available`);
        }
      }
      await screenshot(page, '15.15-audit-filter');
    }
  });
});

// ============================================
// PART 7: SETTINGS (Tests 15.16 - 15.19)
// ============================================

test.describe('PART 7: System Settings', () => {

  test('15.16: Navigate to settings', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/admin/settings');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/إعداد|setting/i);

    const name = await page.locator('#setting-garage-name').count();
    const address = await page.locator('#setting-address').count();
    const phone = await page.locator('#setting-phone').count();

    console.log(`Fields - Name: ${name}, Address: ${address}, Phone: ${phone}`);
    await screenshot(page, '15.16-settings-page');
  });

  test('15.17: Financial settings fields', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/admin/settings');
    await page.waitForTimeout(3000);

    const currency = await page.locator('#setting-currency').count();
    const exchange = await page.locator('#setting-exchange-rate').count();
    const tax = await page.locator('#setting-tax').count();

    console.log(`Fields - Currency: ${currency}, Exchange: ${exchange}, Tax: ${tax}`);
    await screenshot(page, '15.17-financial-settings');
  });

  test('15.18: Currency dropdown', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/admin/settings');
    await page.waitForTimeout(3000);

    const currency = page.locator('#setting-currency');
    if (await currency.count() > 0) {
      const options = await currency.locator('option').all();
      console.log('Currency options:', options.length);
      for (let i = 0; i < Math.min(options.length, 5); i++) {
        const text = await options[i].textContent();
        console.log(`  ${i}: ${text}`);
      }
    }
    await screenshot(page, '15.18-currency-dropdown');
  });

  test('15.19: Save and cancel buttons', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/admin/settings');
    await page.waitForTimeout(3000);

    const saveBtn = page.locator('#settings-save');
    const cancelBtn = page.locator('#settings-cancel');

    if (await saveBtn.count() > 0) {
      await expect(saveBtn).toBeVisible();
      console.log('Save button visible');
    }
    if (await cancelBtn.count() > 0) {
      await expect(cancelBtn).toBeVisible();
      console.log('Cancel button visible');
    }
    await screenshot(page, '15.19-settings-buttons');
  });
});

// ============================================
// PART 8: COST CENTERS (Tests 15.1 - 15.3)
// ============================================

test.describe('PART 8: Cost Centers', () => {

  test('15.1: Navigate to cost centers', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/cost-centers');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/تكلفة|cost|center/i);

    const tbody = await page.locator('#centers-tbody').count();
    console.log('Cost centers table found:', tbody);
    await screenshot(page, '15.1-cost-centers');
  });

  test('15.2: Initialize defaults button', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/cost-centers');
    await page.waitForTimeout(3000);

    const btn = page.locator('#init-defaults-btn');
    if (await btn.count() > 0) {
      await expect(btn).toBeVisible();
      console.log('Init defaults button visible');
    }
    await screenshot(page, '15.2-init-defaults');
  });

  test('15.3: Refresh rates button', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/cost-centers');
    await page.waitForTimeout(3000);

    const btn = page.locator('#refresh-rates-btn');
    if (await btn.count() > 0) {
      await expect(btn).toBeVisible();
      console.log('Refresh rates button visible');
    }
    await screenshot(page, '15.3-refresh-rates');
  });
});

// ============================================
// PART 9: ASSETS (Tests 15.1 - 15.3)
// ============================================

test.describe('PART 9: Assets & Depreciation', () => {

  test('15.1: Navigate to assets', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/assets');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/أصل|asset|استهلاك|depreciation/i);

    const assetsTable = await page.locator('#assets-tbody').count();
    const catsTable = await page.locator('#assets-categories-tbody').count();

    console.log(`Assets table: ${assetsTable}, Categories table: ${catsTable}`);
    await screenshot(page, '15.1-assets-page');
  });

  test('15.2: Asset columns', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/assets');
    await page.waitForTimeout(3000);

    const tbody = await page.locator('#assets-tbody').textContent() || '';
    const thead = await page.locator('#assets-tbody').first().locator('..').locator('thead').textContent() || '';
    const combined = thead + tbody;

    const hasName = /اسم|name/i.test(combined);
    const hasCategory = /فئة|category/i.test(combined);
    const hasCost = /تكلفة|cost/i.test(combined);
    const hasDepreciation = /استهلاك|depreciation/i.test(combined);

    console.log('Name:', hasName, 'Category:', hasCategory, 'Cost:', hasCost, 'Depreciation:', hasDepreciation);
    await screenshot(page, '15.2-asset-columns');
  });

  test('15.3: Asset categories', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/assets');
    await page.waitForTimeout(3000);

    const tbody = await page.locator('#assets-categories-tbody').textContent() || '';
    console.log('Categories table length:', tbody.length);
    await screenshot(page, '15.3-asset-categories');
  });
});

// ============================================
// PART 10: WORKSHOP MAP (Tests 16.1 - 16.3)
// ============================================

test.describe('PART 10: Workshop Map', () => {

  test('16.1: Navigate to workshop map', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/workshop-map');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    expect(body).toMatch(/خريطة|map|ورشة|workshop/i);

    const map = await page.locator('#workshop-map').count();
    console.log('Workshop map found:', map);
    await screenshot(page, '16.1-workshop-map');
  });

  test('16.2: Workshop stations', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/workshop-map');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    const stations = [
      /صيانة|maintenance/i,
      /إصلاح|repair/i,
      /غسيل|wash/i,
    ];

    let found = 0;
    for (const s of stations) {
      if (s.test(body)) found++;
    }
    console.log(`Stations found: ${found}/${stations.length}`);
    await screenshot(page, '16.2-workshop-stations');
  });

  test('16.3: Station status indicators', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:1420#/workshop-map');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent() || '';
    const hasAvailable = /متاح|available/i.test(body);
    const hasBusy = /مشغول|busy/i.test(body);
    const hasReserved = /محجوز|reserved/i.test(body);

    console.log('Available:', hasAvailable, 'Busy:', hasBusy, 'Reserved:', hasReserved);
    await screenshot(page, '16.3-station-status');
  });
});
