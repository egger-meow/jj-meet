const { setupTestDb, teardownTestDb, cleanTestDb, createTestDb } = require('../../setup');
const { createTestUser } = require('../../fixtures/testData');

jest.mock('../../../src/config/database', () => {
  const { createTestDb } = require('../../setup');
  return createTestDb();
});

const ReviewService = require('../../../src/services/review.service');

describe('ReviewService', () => {
  let user1, user2, user3;
  let db;

  beforeAll(async () => {
    db = await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await cleanTestDb();
    user1 = await createTestUser(db, { email: 'reviewer@test.com', name: 'Reviewer' });
    user2 = await createTestUser(db, { email: 'reviewed@test.com', name: 'Reviewed' });
    user3 = await createTestUser(db, { email: 'other@test.com', name: 'Other' });

    await db('matches').insert({
      user1_id: user1.id,
      user2_id: user2.id,
      is_active: true,
    });
  });

  describe('createReview', () => {
    it('should create a new review', async () => {
      const review = await ReviewService.createReview(user1.id, user2.id, {
        rating: 5,
        comment: 'Great guide!',
        is_guide_review: true,
      });

      expect(review).toBeDefined();
      expect(review.rating).toBe(5);
      expect(review.comment).toBe('Great guide!');
      expect(review.reviewer_id).toBe(user1.id);
      expect(review.reviewed_id).toBe(user2.id);
    });

    it('should update existing review', async () => {
      await ReviewService.createReview(user1.id, user2.id, {
        rating: 4,
        comment: 'Good',
      });

      const updated = await ReviewService.createReview(user1.id, user2.id, {
        rating: 5,
        comment: 'Great!',
      });

      expect(updated.rating).toBe(5);
      expect(updated.comment).toBe('Great!');
    });

    it('should reject self-review', async () => {
      await expect(
        ReviewService.createReview(user1.id, user1.id, { rating: 5 })
      ).rejects.toThrow('Cannot review yourself');
    });

    it('should reject review without match', async () => {
      await expect(
        ReviewService.createReview(user1.id, user3.id, { rating: 5 })
      ).rejects.toThrow('Can only review users you have matched with');
    });

    it('should update user rating after review', async () => {
      await ReviewService.createReview(user1.id, user2.id, { rating: 4 });

      const user = await db('users').where({ id: user2.id }).first();

      expect(user.rating).toBe(4);
      expect(user.rating_count).toBe(1);
    });
  });

  describe('getReviewsForUser', () => {
    beforeEach(async () => {
      await ReviewService.createReview(user1.id, user2.id, {
        rating: 5,
        comment: 'Excellent!',
        is_guide_review: true,
      });
    });

    it('should return reviews for a user', async () => {
      const result = await ReviewService.getReviewsForUser(user2.id);

      expect(result.reviews).toHaveLength(1);
      expect(result.reviews[0].rating).toBe(5);
      expect(result.reviews[0].reviewer_name).toBe('Reviewer');
    });

    it('should filter by review type', async () => {
      const guideReviews = await ReviewService.getReviewsForUser(user2.id, { type: 'guide' });
      expect(guideReviews.reviews).toHaveLength(1);

      const regularReviews = await ReviewService.getReviewsForUser(user2.id, { type: 'regular' });
      expect(regularReviews.reviews).toHaveLength(0);
    });

    it('should paginate results', async () => {
      const result = await ReviewService.getReviewsForUser(user2.id, { limit: 10, offset: 0 });
      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('getMyReviews', () => {
    it('should return reviews written by user', async () => {
      await ReviewService.createReview(user1.id, user2.id, { rating: 5 });

      const reviews = await ReviewService.getMyReviews(user1.id);

      expect(reviews).toHaveLength(1);
      expect(reviews[0].reviewed_name).toBe('Reviewed');
    });
  });

  describe('deleteReview', () => {
    it('should delete own review within 24 hours', async () => {
      const review = await ReviewService.createReview(user1.id, user2.id, { rating: 5 });

      const result = await ReviewService.deleteReview(review.id, user1.id);

      expect(result.success).toBe(true);
    });

    it('should reject deleting other user review', async () => {
      const review = await ReviewService.createReview(user1.id, user2.id, { rating: 5 });

      await expect(
        ReviewService.deleteReview(review.id, user2.id)
      ).rejects.toThrow("Cannot delete another user's review");
    });
  });

  describe('getUserRatingStats', () => {
    it('should return rating statistics', async () => {
      await ReviewService.createReview(user1.id, user2.id, { rating: 5 });

      const stats = await ReviewService.getUserRatingStats(user2.id);

      expect(stats.average).toBe(5);
      expect(stats.total).toBe(1);
      expect(stats.distribution[5]).toBe(1);
    });

    it('should return empty stats for user with no reviews', async () => {
      const stats = await ReviewService.getUserRatingStats(user3.id);

      expect(stats.average).toBe(0);
      expect(stats.total).toBe(0);
    });
  });
});
