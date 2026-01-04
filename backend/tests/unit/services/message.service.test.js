const { setupTestDb, teardownTestDb, cleanTestDb, createTestDb } = require('../../setup');
const { createTestUser, createTestMatch, createTestMessage, generateUUID } = require('../../fixtures/testData');

jest.mock('../../../src/config/database', () => {
  const { createTestDb } = require('../../setup');
  return createTestDb();
});

const MessageService = require('../../../src/services/message.service');

describe('MessageService', () => {
  let db;

  beforeAll(async () => {
    db = await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await cleanTestDb();
  });

  describe('sendMessage', () => {
    it('should send a message successfully', async () => {
      const user1 = await createTestUser(db);
      const user2 = await createTestUser(db);
      const match = await createTestMatch(db, user1.id, user2.id);

      const message = await MessageService.sendMessage(match.id, user1.id, {
        content: 'Hello!'
      });

      expect(message).toBeDefined();
      expect(message.content).toBe('Hello!');
      expect(message.sender_id).toBe(user1.id);
      expect(message.match_id).toBe(match.id);
    });

    it('should throw error for empty message', async () => {
      const user1 = await createTestUser(db);
      const user2 = await createTestUser(db);
      const match = await createTestMatch(db, user1.id, user2.id);

      await expect(MessageService.sendMessage(match.id, user1.id, {}))
        .rejects.toMatchObject({
          statusCode: 400,
          code: 'MESSAGE_EMPTY'
        });
    });

    it('should throw error for inactive match', async () => {
      const user1 = await createTestUser(db);
      const user2 = await createTestUser(db);
      
      const [sortedId1, sortedId2] = [user1.id, user2.id].sort();
      const matchId = generateUUID();
      
      await db('matches').insert({
        id: matchId,
        user1_id: sortedId1,
        user2_id: sortedId2,
        is_active: false
      });

      await expect(MessageService.sendMessage(matchId, user1.id, { content: 'Hi' }))
        .rejects.toMatchObject({
          statusCode: 400,
          code: 'MESSAGE_MATCH_INACTIVE'
        });
    });

    it('should allow sending attachment', async () => {
      const user1 = await createTestUser(db);
      const user2 = await createTestUser(db);
      const match = await createTestMatch(db, user1.id, user2.id);

      const message = await MessageService.sendMessage(match.id, user1.id, {
        attachment_url: 'https://example.com/image.jpg',
        attachment_type: 'image'
      });

      expect(message.attachment_url).toBe('https://example.com/image.jpg');
      expect(message.attachment_type).toBe('image');
    });

    it('should update match last_interaction', async () => {
      const user1 = await createTestUser(db);
      const user2 = await createTestUser(db);
      const match = await createTestMatch(db, user1.id, user2.id);

      const beforeMatch = await db('matches').where('id', match.id).first();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await MessageService.sendMessage(match.id, user1.id, { content: 'Update time' });

      const afterMatch = await db('matches').where('id', match.id).first();
      
      expect(new Date(afterMatch.last_interaction).getTime())
        .toBeGreaterThanOrEqual(new Date(beforeMatch.last_interaction).getTime());
    });
  });

  describe('getMessages', () => {
    it('should return messages for a match', async () => {
      const user1 = await createTestUser(db);
      const user2 = await createTestUser(db);
      const match = await createTestMatch(db, user1.id, user2.id);

      await createTestMessage(db, match.id, user1.id, 'Message 1');
      await createTestMessage(db, match.id, user2.id, 'Message 2');

      const messages = await MessageService.getMessages(match.id, user1.id);

      expect(messages).toHaveLength(2);
    });

    it('should mark messages as read', async () => {
      const user1 = await createTestUser(db);
      const user2 = await createTestUser(db);
      const match = await createTestMatch(db, user1.id, user2.id);

      await createTestMessage(db, match.id, user2.id, 'Unread message');

      await MessageService.getMessages(match.id, user1.id);

      const messages = await db('messages').where('match_id', match.id);
      expect(messages[0].is_read).toBe(1);
    });

    it('should respect limit option', async () => {
      const user1 = await createTestUser(db);
      const user2 = await createTestUser(db);
      const match = await createTestMatch(db, user1.id, user2.id);

      for (let i = 0; i < 10; i++) {
        await createTestMessage(db, match.id, user1.id, `Message ${i}`);
      }

      const messages = await MessageService.getMessages(match.id, user1.id, { limit: 5 });

      expect(messages).toHaveLength(5);
    });
  });

  describe('markMessagesAsRead', () => {
    it('should mark all messages from other user as read', async () => {
      const user1 = await createTestUser(db);
      const user2 = await createTestUser(db);
      const match = await createTestMatch(db, user1.id, user2.id);

      await createTestMessage(db, match.id, user2.id, 'Message 1');
      await createTestMessage(db, match.id, user2.id, 'Message 2');

      await MessageService.markMessagesAsRead(match.id, user1.id);

      const messages = await db('messages').where('match_id', match.id);
      messages.forEach(msg => {
        expect(msg.is_read).toBe(1);
      });
    });

    it('should not mark own messages as read', async () => {
      const user1 = await createTestUser(db);
      const user2 = await createTestUser(db);
      const match = await createTestMatch(db, user1.id, user2.id);

      const msg = await createTestMessage(db, match.id, user1.id, 'My message');

      await MessageService.markMessagesAsRead(match.id, user1.id);

      const message = await db('messages').where('id', msg.id).first();
      expect(message.is_read).toBe(0);
    });
  });

  describe('getUnreadCount', () => {
    it('should return total unread count across all matches', async () => {
      const user = await createTestUser(db);
      const other1 = await createTestUser(db);
      const other2 = await createTestUser(db);

      const match1 = await createTestMatch(db, user.id, other1.id);
      const match2 = await createTestMatch(db, user.id, other2.id);

      await createTestMessage(db, match1.id, other1.id, 'Msg 1');
      await createTestMessage(db, match2.id, other2.id, 'Msg 2');
      await createTestMessage(db, match2.id, other2.id, 'Msg 3');

      const count = await MessageService.getUnreadCount(user.id);

      expect(count).toBe(3);
    });

    it('should return 0 when no unread messages', async () => {
      const user = await createTestUser(db);

      const count = await MessageService.getUnreadCount(user.id);

      expect(count).toBe(0);
    });
  });

  describe('getLastMessage', () => {
    it('should return the most recent message', async () => {
      const user1 = await createTestUser(db);
      const user2 = await createTestUser(db);
      const match = await createTestMatch(db, user1.id, user2.id);

      await createTestMessage(db, match.id, user1.id, 'First');
      // SQLite timestamp precision can be inconsistent, wait longer
      await new Promise(resolve => setTimeout(resolve, 1100));
      await createTestMessage(db, match.id, user2.id, 'Last');

      const lastMessage = await MessageService.getLastMessage(match.id);

      expect(lastMessage.content).toBe('Last');
    });
  });
});
