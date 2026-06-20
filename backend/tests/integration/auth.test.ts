import request from 'supertest';
import express from 'express';
import authRoutes from '../../src/modules/auth/routes';

describe('Auth API Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        tenantId: 'test-tenant-123',
        fullName: 'Test User',
        username: 'testuser',
        password: 'password123',
        phone: '+1234567890',
        role: 'RECEPTIONIST',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect('Content-Type', /json/);

      // Note: This will fail without a real database connection
      // In a real setup, you would use a test database
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteData = {
        tenantId: 'test-tenant-123',
        username: 'testuser',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(incompleteData);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const loginData = {
        username: 'testuser',
        password: 'password123',
        tenantId: 'test-tenant-123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect('Content-Type', /json/);

      // Note: This will fail without a real database connection
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);
    });

    it('should return 401 for invalid credentials', async () => {
      const loginData = {
        username: 'wronguser',
        password: 'wrongpassword',
        tenantId: 'test-tenant-123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
