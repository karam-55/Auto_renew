import { test, expect } from '@playwright/test';

const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJ0ZW5hbnRJZCI6IjEiLCJyb2xlIjoiT3duZXIiLCJ1c2VybmFtZSI6ImFkbWluIiwiaWF0IjoxNzgxNjI5NTA5fQ.XhhV-qcuNjfAoP42HvYq5Wwxf93yJ9Jr3kfamvTSIAQ';

const headers = {
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json',
};

test.describe('Notification Rules API', () => {
  test('GET /api/notifications/rules - should return 200 with data array', async ({ request }) => {
    const response = await request.get('/api/notifications/rules', { headers });
    
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('POST /api/notifications/rules - should create a new rule', async ({ request }) => {
    const newRule = {
      name: 'Test Rule',
      nameAr: 'قاعدة اختبار',
      eventType: 'BOOKING_CREATED',
      channels: ['IN_APP'],
      conditions: {},
    };

    const response = await request.post('/api/notifications/rules', {
      headers,
      data: newRule,
    });

    // Should succeed or fail with validation error, not 404
    expect(response.status()).not.toBe(404);
    expect(response.status()).toBeLessThan(500);
    
    const body = await response.json();
    expect(body).toHaveProperty('success');
  });

  test('GET /api/notifications/rules/active - should return active rules', async ({ request }) => {
    const response = await request.get('/api/notifications/rules/active?eventType=BOOKING_CREATED', { headers });
    
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('POST /api/notifications/rules/trigger - should trigger event', async ({ request }) => {
    const triggerData = {
      eventType: 'BOOKING_CREATED',
      data: { test: true },
    };

    const response = await request.post('/api/notifications/rules/trigger', {
      headers,
      data: triggerData,
    });

    expect(response.status()).not.toBe(404);
    expect(response.status()).toBeLessThan(500);
    
    const body = await response.json();
    expect(body).toHaveProperty('success');
  });
});

test.describe('WhatsApp Messages API', () => {
  test('GET /api/whatsapp/messages - should return 200 with data array', async ({ request }) => {
    const response = await request.get('/api/whatsapp/messages?limit=50', { headers });
    
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('GET /api/whatsapp/config - should return config (OWNER only)', async ({ request }) => {
    const response = await request.get('/api/whatsapp/config', { headers });
    
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data');
  });
});

test.describe('Auth & Permissions', () => {
  test('GET /api/notifications/rules without token - should return 401', async ({ request }) => {
    const response = await request.get('/api/notifications/rules');
    expect(response.status()).toBe(401);
  });

  test('GET /api/whatsapp/messages without token - should return 401', async ({ request }) => {
    const response = await request.get('/api/whatsapp/messages?limit=50');
    expect(response.status()).toBe(401);
  });
});
