const { setupTestDb, teardownTestDb, cleanTestDb, createTestDb } = require('../../setup');
const { createTestUser, createTestSwipe, createTestMatch, generateUUID } = require('../../fixtures/testData');

jest.mock('../../../src/config/database', () => {
  const { createTestDb } = require('../../setup');
  return createTestDb();
});

const SwipeService = require('../../../src/services/swipe.service');
const MatchService = require('../../../src/services/match.service');

describe('SwipeService', () => {
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

  describe('SWIPE_DIRECTIONS', () => {
    it('should have correct swipe directions', () => {
      expect(SwipeService.SWIPE_DIRECTIONS.LIKE).toBe('like');
      expect(SwipeService.SWIPE_DIRECTIONS.PASS).toBe('pass');
      expect(SwipeService.SWIPE_DIRECTIONS.SUPER_LIKE).toBe('super_like');
    });
  });

  describe('createSwipe', () => {
    it('should create a swipe successfully', async () => {
      const swiper = await createTestUser(db);
      const swiped = await createTestUser(db);

      const result = await SwipeService.createSwipe(swiper.id, swiped.id, 'like');

      expect(result.swipe).toBeDefined();
      expect(result.swipe.swiper_id).toBe(swiper.id);
      expect(result.swipe.swiped_id).toBe(swiped.id);
      expect(result.swipe.direction).toBe('like');
      expect(result.isMatch).toBe(false);
    });

    it('should create match on mutual like', async () => {
      const user1 = await createTestUser(db);
      const user2 = await createTestUser(db);

      await createTestSwipe(db, user2.id, user1.id, 'like');

      const result = await SwipeService.createSwipe(user1.id, user2.id, 'like');

      expect(result.isMatch).toBe(true);
      expect(result.match).toBeDefined();
    });

    it('should throw error for missing fields', async () => {
      const swiper = await createTestUser(db);

      await expect(SwipeService.createSwipe(swiper.id, null, 'like'))
        .rejects.toMatchObject({
          statusCode: 400,
          code: 'SWIPE_MISSING_FIELDS'
        });
    });

    it('should throw error for invalid direction', async () => {
      const swiper = await createTestUser(db);
      const swiped = await createTestUser(db);

      await expect(SwipeService.createSwipe(swiper.id, swiped.id, 'invalid'))
        .rejects.toMatchObject({
          statusCode: 400,
          code: 'SWIPE_INVALID_DIRECTION'
        });
    });

    it('should throw error when swiping on self', async () => {
      const user = await createTestUser(db);

      await expect(SwipeService.createSwipe(user.id, user.id, 'like'))
        .rejects.toMatchObject({
          statusCode: 400,
          code: 'SWIPE_SELF'
        });
    });

    it('should throw error for duplicate swipe', async () => {
      const swiper = await createTestUser(db);
      const swiped = await createTestUser(db);

      await SwipeService.createSwipe(swiper.id, swiped.id, 'like');

      await expect(SwipeService.createSwipe(swiper.id, swiped.id, 'pass'))
        .rejects.toMatchObject({
          statusCode: 400,
          code: 'SWIPE_DUPLICATE'
        });
    });

    it('should throw error for inactive user', async () => {
      const swiper = await createTestUser(db);
      const swiped = await createTestUser(db, { is_active: false });

      await expect(SwipeService.createSwipe(swiper.id, swiped.id, 'like'))
        .rejects.toMatchObject({
          statusCode: 404,
          code: 'SWIPE_USER_NOT_FOUND'
        });
    });

    it('should not create match on pass', async () => {
      const user1 = await createTestUser(db);
      const user2 = await createTestUser(db);

      await createTestSwipe(db, user2.id, user1.id, 'like');

      const result = await SwipeService.createSwipe(user1.id, user2.id, 'pass');

      expect(result.isMatch).toBe(false);
      expect(result.match).toBeNull();
    });
  });

  describe('checkReciprocalLike', () => {
    it('should find reciprocal like', async () => {
      const user1 = await createTestUser(db);
      const user2 = await createTestUser(db);

      await createTestSwipe(db, user2.id, user1.id, 'like');

      const result = await SwipeService.checkReciprocalLike(user1.id, user2.id);

      expect(result).toBeDefined();
      expect(result.direction).toBe('like');
    });

    it('should return undefined when no reciprocal like', async () => {
      const user1 = await createTestUser(db);
      const user2 = await createTestUser(db);

      const result = await SwipeService.checkReciprocalLike(user1.id, user2.id);

      expect(result).toBeUndefined();
    });
  });

  describe('getSwipeHistory', () => {
    it('should return swipe history', async () => {
      const swiper = await createTestUser(db);
      const swiped1 = await createTestUser(db);
      const swiped2 = await createTestUser(db);

      await createTestSwipe(db, swiper.id, swiped1.id, 'like');
      await createTestSwipe(db, swiper.id, swiped2.id, 'pass');

      const history = await SwipeService.getSwipeHistory(swiper.id);

      expect(history).toHaveLength(2);
    });

    it('should filter by direction', async () => {
      const swiper = await createTestUser(db);
      const swiped1 = await createTestUser(db);
      const swiped2 = await createTestUser(db);

      await createTestSwipe(db, swiper.id, swiped1.id, 'like');
      await createTestSwipe(db, swiper.id, swiped2.id, 'pass');

      const history = await SwipeService.getSwipeHistory(swiper.id, { direction: 'like' });

      expect(history).toHaveLength(1);
      expect(history[0].direction).toBe('like');
    });
  });

  describe('getLikesReceived', () => {
    it('should return users who liked current user', async () => {
      const user = await createTestUser(db);
      const liker1 = await createTestUser(db);
      const liker2 = await createTestUser(db);

      await createTestSwipe(db, liker1.id, user.id, 'like');
      await createTestSwipe(db, liker2.id, user.id, 'super_like');

      const likes = await SwipeService.getLikesReceived(user.id);

      expect(likes).toHaveLength(2);
    });

    it('should exclude users already swiped by current user', async () => {
      const user = await createTestUser(db);
      const liker = await createTestUser(db);

      await createTestSwipe(db, liker.id, user.id, 'like');
      await createTestSwipe(db, user.id, liker.id, 'like');

      const likes = await SwipeService.getLikesReceived(user.id);

      expect(likes).toHaveLength(0);
    });
  });

  describe('undoLastSwipe', () => {
    it('should throw error when no swipe to undo', async () => {
      const user = await createTestUser(db);

      await expect(SwipeService.undoLastSwipe(user.id))
        .rejects.toMatchObject({
          statusCode: 404,
          code: 'SWIPE_NONE_TO_UNDO'
        });
    });
  });
});
