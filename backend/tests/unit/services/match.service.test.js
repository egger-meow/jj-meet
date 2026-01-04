const { setupTestDb, teardownTestDb, cleanTestDb, createTestDb } = require('../../setup');
const { createTestUser, createTestMatch, createTestMessage, generateUUID } = require('../../fixtures/testData');

jest.mock('../../../src/config/database', () => {
  const { createTestDb } = require('../../setup');
  return createTestDb();
});

const MatchService = require('../../../src/services/match.service');

describe('MatchService', () => {
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

  describe('createMatch', () => {
    it('should create a new match', async () => {
      const user1 = await createTestUser(db);
      const user2 = await createTestUser(db);

      const match = await MatchService.createMatch(user1.id, user2.id);

      expect(match).toBeDefined();
      expect(match.is_active).toBe(1);
    });

    it('should sort user IDs consistently', async () => {
      const user1 = await createTestUser(db);
      const user2 = await createTestUser(db);

      const match1 = await MatchService.createMatch(user1.id, user2.id);
      
      await db('matches').where('id', match1.id).del();
      
      const match2 = await MatchService.createMatch(user2.id, user1.id);

      const [sortedId1, sortedId2] = [user1.id, user2.id].sort();
      expect(match2.user1_id).toBe(sortedId1);
      expect(match2.user2_id).toBe(sortedId2);
    });

    it('should reactivate inactive match', async () => {
      const user1 = await createTestUser(db);
      const user2 = await createTestUser(db);

      const [sortedId1, sortedId2] = [user1.id, user2.id].sort();
      
      await db('matches').insert({
        id: generateUUID(),
        user1_id: sortedId1,
        user2_id: sortedId2,
        is_active: false
      });

      const match = await MatchService.createMatch(user1.id, user2.id);

      expect(match.is_active).toBe(1);
    });
  });

  describe('getMatches', () => {
    it('should return matches for user', async () => {
      const user = await createTestUser(db);
      const match1 = await createTestUser(db);
      const match2 = await createTestUser(db);

      await createTestMatch(db, user.id, match1.id);
      await createTestMatch(db, user.id, match2.id);

      const matches = await MatchService.getMatches(user.id);

      expect(matches).toHaveLength(2);
    });

    it('should not return inactive matches', async () => {
      const user = await createTestUser(db);
      const match1 = await createTestUser(db);

      const [sortedId1, sortedId2] = [user.id, match1.id].sort();
      await db('matches').insert({
        id: generateUUID(),
        user1_id: sortedId1,
        user2_id: sortedId2,
        is_active: false
      });

      const matches = await MatchService.getMatches(user.id);

      expect(matches).toHaveLength(0);
    });

    it('should include unread count', async () => {
      const user = await createTestUser(db);
      const other = await createTestUser(db);

      const match = await createTestMatch(db, user.id, other.id);
      await createTestMessage(db, match.id, other.id, 'Hello');
      await createTestMessage(db, match.id, other.id, 'Hi again');

      const matches = await MatchService.getMatches(user.id);

      expect(matches[0].unread_count).toBe(2);
    });
  });

  describe('getMatchById', () => {
    it('should return match for authorized user', async () => {
      const user1 = await createTestUser(db);
      const user2 = await createTestUser(db);

      const createdMatch = await createTestMatch(db, user1.id, user2.id);

      const match = await MatchService.getMatchById(createdMatch.id, user1.id);

      expect(match).toBeDefined();
      expect(match.id).toBe(createdMatch.id);
    });

    it('should throw error for unauthorized user', async () => {
      const user1 = await createTestUser(db);
      const user2 = await createTestUser(db);
      const user3 = await createTestUser(db);

      const match = await createTestMatch(db, user1.id, user2.id);

      await expect(MatchService.getMatchById(match.id, user3.id))
        .rejects.toMatchObject({
          statusCode: 404,
          code: 'MATCH_NOT_FOUND'
        });
    });
  });

  describe('unmatch', () => {
    it('should deactivate match', async () => {
      const user1 = await createTestUser(db);
      const user2 = await createTestUser(db);

      const match = await createTestMatch(db, user1.id, user2.id);

      const result = await MatchService.unmatch(match.id, user1.id);

      expect(result.success).toBe(true);

      const updatedMatch = await db('matches').where('id', match.id).first();
      expect(updatedMatch.is_active).toBe(0);
    });

    it('should throw error for already inactive match', async () => {
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

      await expect(MatchService.unmatch(matchId, user1.id))
        .rejects.toMatchObject({
          statusCode: 400,
          code: 'MATCH_ALREADY_INACTIVE'
        });
    });
  });

  describe('isMatched', () => {
    it('should return true for active match', async () => {
      const user1 = await createTestUser(db);
      const user2 = await createTestUser(db);

      await createTestMatch(db, user1.id, user2.id);

      const result = await MatchService.isMatched(user1.id, user2.id);

      expect(result).toBe(true);
    });

    it('should return false for no match', async () => {
      const user1 = await createTestUser(db);
      const user2 = await createTestUser(db);

      const result = await MatchService.isMatched(user1.id, user2.id);

      expect(result).toBe(false);
    });
  });

  describe('getMatchStats', () => {
    it('should return match statistics', async () => {
      const user = await createTestUser(db);
      const other1 = await createTestUser(db);
      const other2 = await createTestUser(db);

      await createTestMatch(db, user.id, other1.id);
      await createTestMatch(db, user.id, other2.id);

      const stats = await MatchService.getMatchStats(user.id);

      expect(stats.totalMatches).toBe(2);
    });
  });

  describe('getUnreadMessageCount', () => {
    it('should return count of unread messages', async () => {
      const user1 = await createTestUser(db);
      const user2 = await createTestUser(db);

      const match = await createTestMatch(db, user1.id, user2.id);
      await createTestMessage(db, match.id, user2.id, 'Message 1');
      await createTestMessage(db, match.id, user2.id, 'Message 2');

      const count = await MatchService.getUnreadMessageCount(match.id, user1.id);

      expect(count).toBe(2);
    });

    it('should not count own messages', async () => {
      const user1 = await createTestUser(db);
      const user2 = await createTestUser(db);

      const match = await createTestMatch(db, user1.id, user2.id);
      await createTestMessage(db, match.id, user1.id, 'My message');

      const count = await MatchService.getUnreadMessageCount(match.id, user1.id);

      expect(count).toBe(0);
    });
  });
});
