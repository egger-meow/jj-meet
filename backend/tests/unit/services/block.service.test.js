const { setupTestDb, teardownTestDb, cleanTestDb, createTestDb } = require('../../setup');
const { createTestUser } = require('../../fixtures/testData');

jest.mock('../../../src/config/database', () => {
  const { createTestDb } = require('../../setup');
  return createTestDb();
});

const BlockService = require('../../../src/services/block.service');

describe('BlockService', () => {
  let db;
  let testUser1, testUser2, testUser3;

  beforeAll(async () => {
    db = await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await cleanTestDb();
    testUser1 = await createTestUser(db);
    testUser2 = await createTestUser(db);
    testUser3 = await createTestUser(db);
  });

  describe('blockUser', () => {
    it('should block a user successfully', async () => {
      const block = await BlockService.blockUser(testUser1.id, testUser2.id, 'spam');

      expect(block).toBeDefined();
      expect(block.blocker_id).toBe(testUser1.id);
      expect(block.blocked_id).toBe(testUser2.id);
      expect(block.reason).toBe('spam');
    });

    it('should throw error when blocking self', async () => {
      await expect(BlockService.blockUser(testUser1.id, testUser1.id))
        .rejects.toThrow('Cannot block yourself');
    });

    it('should throw error when blocking already blocked user', async () => {
      await BlockService.blockUser(testUser1.id, testUser2.id);

      await expect(BlockService.blockUser(testUser1.id, testUser2.id))
        .rejects.toThrow('User already blocked');
    });
  });

  describe('unblockUser', () => {
    it('should unblock a user successfully', async () => {
      await BlockService.blockUser(testUser1.id, testUser2.id);
      const result = await BlockService.unblockUser(testUser1.id, testUser2.id);

      expect(result.unblocked).toBe(true);
      expect(result.blockedId).toBe(testUser2.id);
    });

    it('should throw error when block not found', async () => {
      await expect(BlockService.unblockUser(testUser1.id, testUser2.id))
        .rejects.toThrow('Block not found');
    });
  });

  describe('getBlockedUsers', () => {
    it('should return list of blocked users', async () => {
      await BlockService.blockUser(testUser1.id, testUser2.id);
      await BlockService.blockUser(testUser1.id, testUser3.id);

      const blockedUsers = await BlockService.getBlockedUsers(testUser1.id);

      expect(blockedUsers).toHaveLength(2);
      expect(blockedUsers.map(u => u.id)).toContain(testUser2.id);
      expect(blockedUsers.map(u => u.id)).toContain(testUser3.id);
    });

    it('should return empty array when no blocked users', async () => {
      const blockedUsers = await BlockService.getBlockedUsers(testUser1.id);
      expect(blockedUsers).toHaveLength(0);
    });
  });

  describe('isBlocked', () => {
    it('should return true when user is blocked', async () => {
      await BlockService.blockUser(testUser1.id, testUser2.id);

      const result = await BlockService.isBlocked(testUser1.id, testUser2.id);
      expect(result).toBe(true);
    });

    it('should return true for reverse direction', async () => {
      await BlockService.blockUser(testUser1.id, testUser2.id);

      const result = await BlockService.isBlocked(testUser2.id, testUser1.id);
      expect(result).toBe(true);
    });

    it('should return false when not blocked', async () => {
      const result = await BlockService.isBlocked(testUser1.id, testUser2.id);
      expect(result).toBe(false);
    });
  });

  describe('getBlockedUserIds', () => {
    it('should return all blocked user IDs (both directions)', async () => {
      await BlockService.blockUser(testUser1.id, testUser2.id);
      await BlockService.blockUser(testUser3.id, testUser1.id);

      const blockedIds = await BlockService.getBlockedUserIds(testUser1.id);

      expect(blockedIds).toContain(testUser2.id);
      expect(blockedIds).toContain(testUser3.id);
    });
  });
});
