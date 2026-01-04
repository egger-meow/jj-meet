const request = require('supertest');
const express = require('express');
const { setupTestDb, teardownTestDb, cleanTestDb, createTestDb } = require('../setup');
const { createTestUser, createTestSwipe } = require('../fixtures/testData');

jest.mock('../../src/config/database', () => {
  const { createTestDb } = require('../setup');
  return createTestDb();
});

const swipeRoutes = require('../../src/routes/swipe.routes');
const authRoutes = require('../../src/routes/auth.routes');
const { errorHandler } = require('../../src/middleware/errorHandler');

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/swipes', swipeRoutes);
  app.use(errorHandler);
  return app;
};

describe('Swipe API Integration Tests', () => {
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

  const getAuthToken = async (email) => {
    await createTestUser(db, { email });
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'password123' });
    return response.body.data.accessToken;
  };

  describe('POST /api/swipes', () => {
    it('should create a swipe', async () => {
      const token = await getAuthToken('swiper@test.com');
      const swiped = await createTestUser(db, { email: 'swiped@test.com' });

      const response = await request(app)
        .post('/api/swipes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          swiped_id: swiped.id,
          direction: 'like'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.swipe.direction).toBe('like');
      expect(response.body.data.isMatch).toBe(false);
    });

    it('should create match on mutual like', async () => {
      const user1 = await createTestUser(db, { email: 'user1@test.com' });
      const user2 = await createTestUser(db, { email: 'user2@test.com' });

      await createTestSwipe(db, user2.id, user1.id, 'like');

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user1@test.com', password: 'password123' });
      const token = loginResponse.body.data.accessToken;

      const response = await request(app)
        .post('/api/swipes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          swiped_id: user2.id,
          direction: 'like'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.isMatch).toBe(true);
      expect(response.body.data.match).toBeDefined();
    });

    it('should reject duplicate swipe', async () => {
      const swiper = await createTestUser(db, { email: 'dup-swiper@test.com' });
      const swiped = await createTestUser(db, { email: 'dup-swiped@test.com' });

      await createTestSwipe(db, swiper.id, swiped.id, 'like');

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: 'dup-swiper@test.com', password: 'password123' });
      const token = loginResponse.body.data.accessToken;

      const response = await request(app)
        .post('/api/swipes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          swiped_id: swiped.id,
          direction: 'pass'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('SWIPE_DUPLICATE');
    });

    it('should reject without authentication', async () => {
      const response = await request(app)
        .post('/api/swipes')
        .send({
          swiped_id: 'some-id',
          direction: 'like'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/swipes/history', () => {
    it('should return swipe history', async () => {
      const swiper = await createTestUser(db, { email: 'history@test.com' });
      const swiped1 = await createTestUser(db, { email: 'swiped1@test.com' });
      const swiped2 = await createTestUser(db, { email: 'swiped2@test.com' });

      await createTestSwipe(db, swiper.id, swiped1.id, 'like');
      await createTestSwipe(db, swiper.id, swiped2.id, 'pass');

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: 'history@test.com', password: 'password123' });
      const token = loginResponse.body.data.accessToken;

      const response = await request(app)
        .get('/api/swipes/history')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter by direction', async () => {
      const swiper = await createTestUser(db, { email: 'filter@test.com' });
      const swiped1 = await createTestUser(db, { email: 'f-swiped1@test.com' });
      const swiped2 = await createTestUser(db, { email: 'f-swiped2@test.com' });

      await createTestSwipe(db, swiper.id, swiped1.id, 'like');
      await createTestSwipe(db, swiper.id, swiped2.id, 'pass');

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: 'filter@test.com', password: 'password123' });
      const token = loginResponse.body.data.accessToken;

      const response = await request(app)
        .get('/api/swipes/history?direction=like')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].direction).toBe('like');
    });
  });

  describe('GET /api/swipes/likes', () => {
    it('should return users who liked current user', async () => {
      const user = await createTestUser(db, { email: 'liked@test.com' });
      const liker1 = await createTestUser(db, { email: 'liker1@test.com' });
      const liker2 = await createTestUser(db, { email: 'liker2@test.com' });

      await createTestSwipe(db, liker1.id, user.id, 'like');
      await createTestSwipe(db, liker2.id, user.id, 'super_like');

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: 'liked@test.com', password: 'password123' });
      const token = loginResponse.body.data.accessToken;

      const response = await request(app)
        .get('/api/swipes/likes')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });
});
