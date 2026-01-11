const request = require('supertest');
const express = require('express');
const { setupTestDb, teardownTestDb, cleanTestDb, createTestDb } = require('../setup');
const { createTestUser, createTestMatch, createTestMessage } = require('../fixtures/testData');

jest.mock('../../src/config/database', () => {
  const { createTestDb } = require('../setup');
  return createTestDb();
});

const messageRoutes = require('../../src/routes/message.routes');
const authRoutes = require('../../src/routes/auth.routes');
const { errorHandler } = require('../../src/middleware/errorHandler');

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/messages', messageRoutes);
  app.use(errorHandler);
  return app;
};

describe('Message API Integration Tests', () => {
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

  describe('GET /api/messages/:matchId', () => {
    it('should return messages for a match', async () => {
      const user = await createTestUser(db, { email: 'msg-user@test.com' });
      const other = await createTestUser(db, { email: 'msg-other@test.com' });
      const match = await createTestMatch(db, user.id, other.id);

      await createTestMessage(db, match.id, user.id, 'Hello!');
      await createTestMessage(db, match.id, other.id, 'Hi there!');

      const token = await loginUser('msg-user@test.com');

      const response = await request(app)
        .get(`/api/messages/${match.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should return 404 for non-existent match', async () => {
      const user = await createTestUser(db, { email: 'no-match@test.com' });
      const token = await loginUser('no-match@test.com');

      const response = await request(app)
        .get('/api/messages/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('should reject unauthorized access to other users match', async () => {
      const user1 = await createTestUser(db, { email: 'user1@test.com' });
      const user2 = await createTestUser(db, { email: 'user2@test.com' });
      const user3 = await createTestUser(db, { email: 'user3@test.com' });

      const match = await createTestMatch(db, user1.id, user2.id);
      const token = await loginUser('user3@test.com');

      const response = await request(app)
        .get(`/api/messages/${match.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('should paginate messages', async () => {
      const user = await createTestUser(db, { email: 'page-user@test.com' });
      const other = await createTestUser(db, { email: 'page-other@test.com' });
      const match = await createTestMatch(db, user.id, other.id);

      for (let i = 0; i < 25; i++) {
        await createTestMessage(db, match.id, user.id, `Message ${i}`);
      }

      const token = await loginUser('page-user@test.com');

      const response = await request(app)
        .get(`/api/messages/${match.id}?limit=10`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(10);
    });
  });

  describe('POST /api/messages/:matchId', () => {
    it('should send a message', async () => {
      const user = await createTestUser(db, { email: 'send-user@test.com' });
      const other = await createTestUser(db, { email: 'send-other@test.com' });
      const match = await createTestMatch(db, user.id, other.id);

      const token = await loginUser('send-user@test.com');

      const response = await request(app)
        .post(`/api/messages/${match.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Test message' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe('Test message');
    });

    it('should reject empty message', async () => {
      const user = await createTestUser(db, { email: 'empty-user@test.com' });
      const other = await createTestUser(db, { email: 'empty-other@test.com' });
      const match = await createTestMatch(db, user.id, other.id);

      const token = await loginUser('empty-user@test.com');

      const response = await request(app)
        .post(`/api/messages/${match.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: '' });

      expect(response.status).toBe(400);
    });

    it('should reject message to inactive match', async () => {
      const user = await createTestUser(db, { email: 'inactive-user@test.com' });
      const other = await createTestUser(db, { email: 'inactive-other@test.com' });
      const match = await createTestMatch(db, user.id, other.id);

      await db('matches').where({ id: match.id }).update({ is_active: false });

      const token = await loginUser('inactive-user@test.com');

      const response = await request(app)
        .post(`/api/messages/${match.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Test' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/messages/:matchId/read', () => {
    it('should mark messages as read', async () => {
      const user = await createTestUser(db, { email: 'read-user@test.com' });
      const other = await createTestUser(db, { email: 'read-other@test.com' });
      const match = await createTestMatch(db, user.id, other.id);

      await createTestMessage(db, match.id, other.id, 'Unread 1');
      await createTestMessage(db, match.id, other.id, 'Unread 2');

      const token = await loginUser('read-user@test.com');

      const response = await request(app)
        .post(`/api/messages/${match.id}/read`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const messages = await db('messages')
        .where({ match_id: match.id, sender_id: other.id });
      expect(messages.every(m => m.is_read)).toBe(true);
    });
  });

  describe('DELETE /api/messages/:messageId', () => {
    it('should delete own message', async () => {
      const user = await createTestUser(db, { email: 'del-user@test.com' });
      const other = await createTestUser(db, { email: 'del-other@test.com' });
      const match = await createTestMatch(db, user.id, other.id);
      const message = await createTestMessage(db, match.id, user.id, 'To delete');

      const token = await loginUser('del-user@test.com');

      const response = await request(app)
        .delete(`/api/messages/${message.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject deleting other users message', async () => {
      const user = await createTestUser(db, { email: 'cant-del-user@test.com' });
      const other = await createTestUser(db, { email: 'cant-del-other@test.com' });
      const match = await createTestMatch(db, user.id, other.id);
      const message = await createTestMessage(db, match.id, other.id, 'Not yours');

      const token = await loginUser('cant-del-user@test.com');

      const response = await request(app)
        .delete(`/api/messages/${message.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/messages/unread', () => {
    it('should return unread count', async () => {
      const user = await createTestUser(db, { email: 'unread-user@test.com' });
      const other1 = await createTestUser(db, { email: 'unread-other1@test.com' });
      const other2 = await createTestUser(db, { email: 'unread-other2@test.com' });

      const match1 = await createTestMatch(db, user.id, other1.id);
      const match2 = await createTestMatch(db, user.id, other2.id);

      await createTestMessage(db, match1.id, other1.id, 'Unread 1');
      await createTestMessage(db, match1.id, other1.id, 'Unread 2');
      await createTestMessage(db, match2.id, other2.id, 'Unread 3');

      const token = await loginUser('unread-user@test.com');

      const response = await request(app)
        .get('/api/messages/unread')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.unreadCount).toBe(3);
    });
  });

  describe('GET /api/messages/search', () => {
    // Skip: ILIKE is PostgreSQL-specific, SQLite test DB uses LIKE differently
    it.skip('should search messages (PostgreSQL only - uses ILIKE)', async () => {
      const user = await createTestUser(db, { email: 'search-user@test.com' });
      const other = await createTestUser(db, { email: 'search-other@test.com' });
      const match = await createTestMatch(db, user.id, other.id);

      await createTestMessage(db, match.id, user.id, 'Hello world');
      await createTestMessage(db, match.id, other.id, 'Goodbye world');
      await createTestMessage(db, match.id, user.id, 'Random text');

      const token = await loginUser('search-user@test.com');

      const response = await request(app)
        .get('/api/messages/search?q=world')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
    });
  });
});
