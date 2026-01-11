const { setupTestDb, teardownTestDb, cleanTestDb, createTestDb } = require('../../setup');
const { createTestUser } = require('../../fixtures/testData');

jest.mock('../../../src/config/database', () => {
  const { createTestDb } = require('../../setup');
  return createTestDb();
});

const ModerationService = require('../../../src/services/moderation.service');

describe('ModerationService', () => {
  let db;
  let testUser1, testUser2;

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
  });

  describe('shadowBanUser', () => {
    it('should shadow ban a user successfully', async () => {
      const result = await ModerationService.shadowBanUser(testUser1.id, 'spam');

      expect(result.is_shadow_banned).toBeTruthy();
      expect(result.shadow_ban_reason).toBe('spam');
    });

    it('should shadow ban with duration', async () => {
      const result = await ModerationService.shadowBanUser(testUser1.id, 'harassment', 7);

      expect(result.is_shadow_banned).toBeTruthy();
      expect(result.shadow_ban_until).toBeDefined();
    });

    it('should throw error for invalid reason', async () => {
      await expect(
        ModerationService.shadowBanUser(testUser1.id, 'invalid_reason')
      ).rejects.toThrow('Invalid shadow ban reason');
    });
  });

  describe('removeShadowBan', () => {
    it('should remove shadow ban successfully', async () => {
      await ModerationService.shadowBanUser(testUser1.id, 'spam');
      const result = await ModerationService.removeShadowBan(testUser1.id);

      expect(result.is_shadow_banned).toBeFalsy();
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        ModerationService.removeShadowBan('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow('User not found');
    });
  });

  describe('isShadowBanned', () => {
    it('should return true for shadow banned user', async () => {
      await ModerationService.shadowBanUser(testUser1.id, 'spam');
      const result = await ModerationService.isShadowBanned(testUser1.id);

      expect(result).toBe(true);
    });

    it('should return false for non-shadow banned user', async () => {
      const result = await ModerationService.isShadowBanned(testUser1.id);

      expect(result).toBe(false);
    });
  });

  describe('banUser', () => {
    it('should ban a user successfully', async () => {
      const result = await ModerationService.banUser(testUser1.id, 'harassment');

      expect(result.is_banned).toBeTruthy();
      expect(result.ban_reason).toBe('harassment');
    });
  });

  describe('unbanUser', () => {
    it('should unban a user successfully', async () => {
      await ModerationService.banUser(testUser1.id, 'harassment');
      const result = await ModerationService.unbanUser(testUser1.id);

      expect(result.is_banned).toBeFalsy();
    });
  });

  describe('isBanned', () => {
    it('should return true for banned user', async () => {
      await ModerationService.banUser(testUser1.id, 'harassment');
      const result = await ModerationService.isBanned(testUser1.id);

      expect(result).toBe(true);
    });

    it('should return false for non-banned user', async () => {
      const result = await ModerationService.isBanned(testUser1.id);

      expect(result).toBe(false);
    });
  });

  describe('getShadowBannedUserIds', () => {
    it('should return array of shadow banned user IDs', async () => {
      await ModerationService.shadowBanUser(testUser1.id, 'spam');
      await ModerationService.shadowBanUser(testUser2.id, 'harassment');

      const result = await ModerationService.getShadowBannedUserIds();

      expect(result).toContain(testUser1.id);
      expect(result).toContain(testUser2.id);
    });

    it('should return empty array when no shadow banned users', async () => {
      const result = await ModerationService.getShadowBannedUserIds();

      expect(result).toHaveLength(0);
    });
  });

  describe('getUserModerationStatus', () => {
    it('should return moderation status for user', async () => {
      await ModerationService.shadowBanUser(testUser1.id, 'spam');
      const result = await ModerationService.getUserModerationStatus(testUser1.id);

      expect(result.is_shadow_banned).toBeTruthy();
      expect(result.shadow_ban_reason).toBe('spam');
    });
  });

  describe('getShadowBanReasons', () => {
    it('should return list of valid reasons', () => {
      const reasons = ModerationService.getShadowBanReasons();

      expect(reasons).toContain('spam');
      expect(reasons).toContain('harassment');
      expect(reasons).toContain('fake_profile');
    });
  });
});
