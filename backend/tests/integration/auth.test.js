const request = require('supertest');
const express = require('express');
const { setupTestDb, teardownTestDb, cleanTestDb, createTestDb } = require('../setup');
const { createTestUser } = require('../fixtures/testData');

jest.mock('../../src/config/database', () => {
  const { createTestDb } = require('../setup');
  return createTestDb();
});

const authRoutes = require('../../src/routes/auth.routes');
const { errorHandler } = require('../../src/middleware/errorHandler');

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use(errorHandler);
  return app;
};

describe('Auth API Integration Tests', () => {
  let app;
  let db;

  beforeAll(async () => {
    db = await setupTestDb();
    app = createApp();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await cleanTestDb();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@test.com',
          password: 'password123',
          name: 'New User',
          birth_date: '1990-01-01',
          gender: 'other'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('newuser@test.com');
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User',
          birth_date: '1990-01-01'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          password: '123',
          name: 'Test User',
          birth_date: '1990-01-01'
        });

      expect(response.status).toBe(400);
    });

    it('should reject duplicate email', async () => {
      await createTestUser(db, { email: 'existing@test.com' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@test.com',
          password: 'password123',
          name: 'Another User',
          birth_date: '1990-01-01'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_EMAIL_EXISTS');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      await createTestUser(db, { email: 'login@test.com' });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('login@test.com');
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
    });

    it('should reject invalid password', async () => {
      await createTestUser(db, { email: 'wrongpass@test.com' });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrongpass@test.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return refresh token with device info', async () => {
      await createTestUser(db, { email: 'device@test.com' });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'device@test.com',
          password: 'password123',
          deviceId: 'test-device-123',
          deviceName: 'Test iPhone',
          platform: 'ios'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.refreshToken).toBeDefined();
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should return profile for authenticated user', async () => {
      const user = await createTestUser(db, { email: 'profile@test.com' });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'profile@test.com',
          password: 'password123'
        });

      const token = loginResponse.body.data.accessToken;

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('profile@test.com');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      expect(response.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/auth/profile', () => {
    it('should update profile for authenticated user', async () => {
      await createTestUser(db, { email: 'update@test.com' });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'update@test.com',
          password: 'password123'
        });

      const token = loginResponse.body.data.accessToken;

      const response = await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name',
          bio: 'New bio content'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.bio).toBe('New bio content');
    });
  });
});
