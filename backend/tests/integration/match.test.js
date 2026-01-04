const request = require('supertest');
const express = require('express');
const { setupTestDb, teardownTestDb, cleanTestDb, createTestDb } = require('../setup');
const { createTestUser, createTestMatch, createTestMessage } = require('../fixtures/testData');

jest.mock('../../src/config/database', () => {
  const { createTestDb } = require('../setup');
  return createTestDb();
});

const matchRoutes = require('../../src/routes/match.routes');
const authRoutes = require('../../src/routes/auth.routes');
const { errorHandler } = require('../../src/middleware/errorHandler');

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/matches', matchRoutes);
  app.use(errorHandler);
  return app;
};

describe('Match API Integration Tests', () => {
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

  const loginUser = async (email) => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'password123' });
    return response.body.data.accessToken;
  };

  describe('GET /api/matches', () => {
    it('should return all matches for user', async () => {
      const user = await createTestUser(db, { email: 'match-user@test.com' });
      const other1 = await createTestUser(db, { email: 'other1@test.com' });
      const other2 = await createTestUser(db, { email: 'other2@test.com' });

      await createTestMatch(db, user.id, other1.id);
      await createTestMatch(db, user.id, other2.id);

      const token = await loginUser('match-user@test.com');

      const response = await request(app)
        .get('/api/matches')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should include unread message count', async () => {
      const user = await createTestUser(db, { email: 'unread-user@test.com' });
      const other = await createTestUser(db, { email: 'unread-other@test.com' });

      const match = await createTestMatch(db, user.id, other.id);
      await createTestMessage(db, match.id, other.id, 'Hello');
      await createTestMessage(db, match.id, other.id, 'How are you?');

      const token = await loginUser('unread-user@test.com');

      const response = await request(app)
        .get('/api/matches')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data[0].unread_count).toBe(2);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/matches');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/matches/:matchId', () => {
    it('should return specific match', async () => {
      const user = await createTestUser(db, { email: 'get-match@test.com' });
      const other = await createTestUser(db, { email: 'get-other@test.com' });

      const match = await createTestMatch(db, user.id, other.id);
      const token = await loginUser('get-match@test.com');

      const response = await request(app)
        .get(`/api/matches/${match.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(match.id);
    });

    it('should return 404 for unauthorized user', async () => {
      const user1 = await createTestUser(db, { email: 'u1@test.com' });
      const user2 = await createTestUser(db, { email: 'u2@test.com' });
      const user3 = await createTestUser(db, { email: 'u3@test.com' });

      const match = await createTestMatch(db, user1.id, user2.id);
      const token = await loginUser('u3@test.com');

      const response = await request(app)
        .get(`/api/matches/${match.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/matches/:matchId', () => {
    it('should unmatch successfully', async () => {
      const user = await createTestUser(db, { email: 'unmatch-user@test.com' });
      const other = await createTestUser(db, { email: 'unmatch-other@test.com' });

      const match = await createTestMatch(db, user.id, other.id);
      const token = await loginUser('unmatch-user@test.com');

      const response = await request(app)
        .delete(`/api/matches/${match.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const updatedMatch = await db('matches').where('id', match.id).first();
      expect(updatedMatch.is_active).toBe(0);
    });

    it('should return 404 for non-existent match', async () => {
      await createTestUser(db, { email: 'no-match@test.com' });
      const token = await loginUser('no-match@test.com');

      const response = await request(app)
        .delete('/api/matches/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/matches/stats', () => {
    it('should return match statistics', async () => {
      const user = await createTestUser(db, { email: 'stats-user@test.com' });
      const other1 = await createTestUser(db, { email: 'stats-other1@test.com' });
      const other2 = await createTestUser(db, { email: 'stats-other2@test.com' });

      await createTestMatch(db, user.id, other1.id);
      await createTestMatch(db, user.id, other2.id);

      const token = await loginUser('stats-user@test.com');

      const response = await request(app)
        .get('/api/matches/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalMatches).toBe(2);
    });
  });
});
