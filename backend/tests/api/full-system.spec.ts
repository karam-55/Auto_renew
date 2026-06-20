import { test, expect } from '@playwright/test';

const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJ0ZW5hbnRJZCI6IjEiLCJyb2xlIjoiT3duZXIiLCJ1c2VybmFtZSI6ImFkbWluIiwiaWF0IjoxNzgxNjI5NTA5fQ.XhhV-qcuNjfAoP42HvYq5Wwxf93yJ9Jr3kfamvTSIAQ';

const headers = {
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json',
};

function expectSuccess(response: any) {
  expect(response.status()).toBe(200);
}

function expectNo404(response: any) {
  expect(response.status()).not.toBe(404);
  expect(response.status()).toBeLessThan(500);
}

// ============================================
// DASHBOARD & ANALYTICS
// ============================================
test.describe('Dashboard & Analytics', () => {
  test('GET /api/dashboard/kpis', async ({ request }) => {
    const response = await request.get('/api/dashboard/kpis', { headers });
    expectNo404(response);
  });

  test('GET /api/insights', async ({ request }) => {
    const response = await request.get('/api/insights', { headers });
    expectNo404(response);
  });

  test('GET /api/analytics/sales', async ({ request }) => {
    const response = await request.get('/api/analytics/sales', { headers });
    expectNo404(response);
  });

  test('GET /api/analytics/profitability', async ({ request }) => {
    const response = await request.get('/api/analytics/profitability', { headers });
    expectNo404(response);
  });

  test('GET /api/analytics/bookings', async ({ request }) => {
    const response = await request.get('/api/analytics/bookings', { headers });
    expectNo404(response);
  });

  test('GET /api/analytics/inventory', async ({ request }) => {
    const response = await request.get('/api/analytics/inventory', { headers });
    expectNo404(response);
  });

  test('GET /api/analytics/memberships', async ({ request }) => {
    const response = await request.get('/api/analytics/memberships', { headers });
    expectNo404(response);
  });

  test('GET /api/analytics/branches', async ({ request }) => {
    const response = await request.get('/api/analytics/branches', { headers });
    expectNo404(response);
  });
});

// ============================================
// AUTH & USERS
// ============================================
test.describe('Auth & Users', () => {
  test('POST /api/auth/login', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin123' },
    });
    expect(response.status()).not.toBe(404);
  });

  test('GET /api/users', async ({ request }) => {
    const response = await request.get('/api/users', { headers });
    expectNo404(response);
  });
});

// ============================================
// CUSTOMERS & VEHICLES
// ============================================
test.describe('Customers & Vehicles', () => {
  test('GET /api/customers', async ({ request }) => {
    const response = await request.get('/api/customers', { headers });
    expectNo404(response);
  });

  test('GET /api/vehicles', async ({ request }) => {
    const response = await request.get('/api/vehicles', { headers });
    expectNo404(response);
  });

  test('GET /api/vehicle-categories', async ({ request }) => {
    const response = await request.get('/api/vehicle-categories', { headers });
    expectNo404(response);
  });
});

// ============================================
// SERVICES & BOOKINGS
// ============================================
test.describe('Services & Bookings', () => {
  test('GET /api/services', async ({ request }) => {
    const response = await request.get('/api/services', { headers });
    expectNo404(response);
  });

  test('GET /api/service-categories', async ({ request }) => {
    const response = await request.get('/api/service-categories', { headers });
    expectNo404(response);
  });

  test('GET /api/bookings', async ({ request }) => {
    const response = await request.get('/api/bookings', { headers });
    expectNo404(response);
  });

  test('GET /api/mechanic-assignments', async ({ request }) => {
    const response = await request.get('/api/mechanic-assignments', { headers });
    expectNo404(response);
  });
});

// ============================================
// INVENTORY & PARTS
// ============================================
test.describe('Inventory & Parts', () => {
  test('GET /api/parts', async ({ request }) => {
    const response = await request.get('/api/parts', { headers });
    expectNo404(response);
  });

  test('GET /api/part-categories', async ({ request }) => {
    const response = await request.get('/api/part-categories', { headers });
    expectNo404(response);
  });

  test('GET /api/suppliers', async ({ request }) => {
    const response = await request.get('/api/suppliers', { headers });
    expectNo404(response);
  });

  test('GET /api/warehouses', async ({ request }) => {
    const response = await request.get('/api/warehouses', { headers });
    expectNo404(response);
  });

  test('GET /api/inventory-transactions', async ({ request }) => {
    const response = await request.get('/api/inventory-transactions', { headers });
    expectNo404(response);
  });

  test('GET /api/purchase-orders', async ({ request }) => {
    const response = await request.get('/api/purchase-orders', { headers });
    expectNo404(response);
  });

  test('GET /api/grn', async ({ request }) => {
    const response = await request.get('/api/grn', { headers });
    expectNo404(response);
  });

  test('GET /api/inventory', async ({ request }) => {
    const response = await request.get('/api/inventory', { headers });
    expectNo404(response);
  });

  test('GET /api/inventory-count', async ({ request }) => {
    const response = await request.get('/api/inventory-count', { headers });
    expectNo404(response);
  });
});

// ============================================
// INVOICES & PAYMENTS
// ============================================
test.describe('Invoices & Payments', () => {
  test('GET /api/invoices', async ({ request }) => {
    const response = await request.get('/api/invoices', { headers });
    expectNo404(response);
  });

  test('GET /api/payments', async ({ request }) => {
    const response = await request.get('/api/payments', { headers });
    expectNo404(response);
  });

  test('GET /api/cheques', async ({ request }) => {
    const response = await request.get('/api/cheques', { headers });
    expectNo404(response);
  });

  test('GET /api/installments', async ({ request }) => {
    const response = await request.get('/api/installments', { headers });
    expectNo404(response);
  });
});

// ============================================
// ACCOUNTING
// ============================================
test.describe('Accounting', () => {
  test('GET /api/accounts', async ({ request }) => {
    const response = await request.get('/api/accounts', { headers });
    expectNo404(response);
  });

  test('GET /api/journal-entries', async ({ request }) => {
    const response = await request.get('/api/journal-entries', { headers });
    expectNo404(response);
  });

  test('GET /api/fiscal-periods', async ({ request }) => {
    const response = await request.get('/api/fiscal-periods', { headers });
    expectNo404(response);
  });

  test('GET /api/accounting', async ({ request }) => {
    const response = await request.get('/api/accounting', { headers });
    expectNo404(response);
  });
});

// ============================================
// HR MODULE
// ============================================
test.describe('HR Module', () => {
  test('GET /api/employees', async ({ request }) => {
    const response = await request.get('/api/employees', { headers });
    expectNo404(response);
  });

  test('GET /api/departments', async ({ request }) => {
    const response = await request.get('/api/departments', { headers });
    expectNo404(response);
  });

  test('GET /api/shifts', async ({ request }) => {
    const response = await request.get('/api/shifts', { headers });
    expectNo404(response);
  });

  test('GET /api/attendance', async ({ request }) => {
    const response = await request.get('/api/attendance', { headers });
    expectNo404(response);
  });

  test('GET /api/payroll', async ({ request }) => {
    const response = await request.get('/api/payroll', { headers });
    expectNo404(response);
  });

  test('GET /api/hr/employees', async ({ request }) => {
    const response = await request.get('/api/hr/employees', { headers });
    expectNo404(response);
  });

  test('GET /api/hr/departments', async ({ request }) => {
    const response = await request.get('/api/hr/departments', { headers });
    expectNo404(response);
  });

  test('GET /api/hr/attendance', async ({ request }) => {
    const response = await request.get('/api/hr/attendance', { headers });
    expectNo404(response);
  });

  test('GET /api/hr/payroll', async ({ request }) => {
    const response = await request.get('/api/hr/payroll', { headers });
    expectNo404(response);
  });

  test('GET /api/hr/shifts', async ({ request }) => {
    const response = await request.get('/api/hr/shifts', { headers });
    expectNo404(response);
  });
});

// ============================================
// NOTIFICATIONS
// ============================================
test.describe('Notifications', () => {
  test('GET /api/notifications', async ({ request }) => {
    const response = await request.get('/api/notifications', { headers });
    expectNo404(response);
  });

  test('GET /api/notifications/rules', async ({ request }) => {
    const response = await request.get('/api/notifications/rules', { headers });
    expectSuccess(response);
    const body = await response.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('GET /api/notifications/rules/active', async ({ request }) => {
    const response = await request.get('/api/notifications/rules/active?eventType=BOOKING_CREATED', { headers });
    expectSuccess(response);
  });
});

// ============================================
// WHATSAPP & MESSAGING
// ============================================
test.describe('WhatsApp & Messaging', () => {
  test('GET /api/whatsapp/messages', async ({ request }) => {
    const response = await request.get('/api/whatsapp/messages?limit=50', { headers });
    expectSuccess(response);
    const body = await response.json();
    expect(body).toHaveProperty('success', true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('GET /api/whatsapp/config', async ({ request }) => {
    const response = await request.get('/api/whatsapp/config', { headers });
    expectSuccess(response);
  });

  test('GET /api/fcm', async ({ request }) => {
    const response = await request.get('/api/fcm', { headers });
    expectNo404(response);
  });
});

// ============================================
// REPORTS & EXPORTS
// ============================================
test.describe('Reports & Exports', () => {
  test('GET /api/reports', async ({ request }) => {
    const response = await request.get('/api/reports', { headers });
    expectNo404(response);
  });

  test('GET /api/reports/advanced', async ({ request }) => {
    const response = await request.get('/api/reports/advanced', { headers });
    expectNo404(response);
  });

  test('GET /api/reports-management', async ({ request }) => {
    const response = await request.get('/api/reports-management', { headers });
    expectNo404(response);
  });

  test('GET /api/data-exports', async ({ request }) => {
    const response = await request.get('/api/data-exports', { headers });
    expectNo404(response);
  });
});

// ============================================
// BRANCHES & TENANTS
// ============================================
test.describe('Branches & Tenants', () => {
  test('GET /api/branches', async ({ request }) => {
    const response = await request.get('/api/branches', { headers });
    expectNo404(response);
  });

  test('GET /api/tenants', async ({ request }) => {
    const response = await request.get('/api/tenants', { headers });
    expectNo404(response);
  });
});

// ============================================
// MAINTENANCE & LOYALTY
// ============================================
test.describe('Maintenance & Loyalty', () => {
  test('GET /api/maintenance', async ({ request }) => {
    const response = await request.get('/api/maintenance', { headers });
    expectNo404(response);
  });

  test('GET /api/loyalty', async ({ request }) => {
    const response = await request.get('/api/loyalty', { headers });
    expectNo404(response);
  });

  test('GET /api/memberships', async ({ request }) => {
    const response = await request.get('/api/memberships', { headers });
    expectNo404(response);
  });
});

// ============================================
// EXPENSES & SCHEDULE
// ============================================
test.describe('Expenses & Schedule', () => {
  test('GET /api/expenses', async ({ request }) => {
    const response = await request.get('/api/expenses', { headers });
    expectNo404(response);
  });

  test('GET /api/schedule', async ({ request }) => {
    const response = await request.get('/api/schedule', { headers });
    expectNo404(response);
  });

  test('GET /api/work-orders', async ({ request }) => {
    const response = await request.get('/api/work-orders', { headers });
    expectNo404(response);
  });
});

// ============================================
// CURRENCIES
// ============================================
test.describe('Currencies', () => {
  test('GET /api/currencies', async ({ request }) => {
    const response = await request.get('/api/currencies', { headers });
    expectNo404(response);
  });
});

// ============================================
// RBAC & AUDIT
// ============================================
test.describe('RBAC & Audit', () => {
  test('GET /api/permissions', async ({ request }) => {
    const response = await request.get('/api/permissions', { headers });
    expectNo404(response);
  });

  test('GET /api/audit', async ({ request }) => {
    const response = await request.get('/api/audit', { headers });
    expectNo404(response);
  });
});

// ============================================
// AI MODULE
// ============================================
test.describe('AI Module', () => {
  test('POST /api/ai/query', async ({ request }) => {
    const response = await request.post('/api/ai/query', {
      headers,
      data: { query: 'test' },
    });
    expectNo404(response);
  });
});
