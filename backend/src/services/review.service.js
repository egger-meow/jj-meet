const knex = require('../config/database');

class ReviewService {
  static async createReview(reviewerId, reviewedId, data) {
    if (reviewerId === reviewedId) {
      const error = new Error('Cannot review yourself');
      error.statusCode = 400;
      error.code = 'REVIEW_SELF_REVIEW';
      throw error;
    }

    const hasMatched = await knex('matches')
      .where(function() {
        this.where({ user1_id: reviewerId, user2_id: reviewedId })
          .orWhere({ user1_id: reviewedId, user2_id: reviewerId });
      })
      .first();

    if (!hasMatched) {
      const error = new Error('Can only review users you have matched with');
      error.statusCode = 403;
      error.code = 'REVIEW_NO_MATCH';
      throw error;
    }

    const existingReview = await knex('reviews')
      .where({ reviewer_id: reviewerId, reviewed_id: reviewedId })
      .first();

    let review;
    if (existingReview) {
      [review] = await knex('reviews')
        .where({ id: existingReview.id })
        .update({
          rating: data.rating,
          comment: data.comment,
          is_guide_review: data.is_guide_review || false,
        })
        .returning('*');
    } else {
      [review] = await knex('reviews')
        .insert({
          reviewer_id: reviewerId,
          reviewed_id: reviewedId,
          rating: data.rating,
          comment: data.comment,
          is_guide_review: data.is_guide_review || false,
        })
        .returning('*');
    }

    await this.updateUserRating(reviewedId);

    return review;
  }

  static async updateUserRating(userId) {
    const stats = await knex('reviews')
      .where({ reviewed_id: userId })
      .select(
        knex.raw('AVG(rating) as avg_rating'),
        knex.raw('COUNT(*) as review_count')
      )
      .first();

    await knex('users')
      .where({ id: userId })
      .update({
        rating: parseFloat(stats.avg_rating) || 0,
        rating_count: parseInt(stats.review_count) || 0,
      });
  }

  static async getReviewsForUser(userId, options = {}) {
    const { limit = 20, offset = 0, type } = options;

    let query = knex('reviews')
      .where({ reviewed_id: userId })
      .join('users', 'reviews.reviewer_id', 'users.id')
      .select(
        'reviews.*',
        'users.name as reviewer_name',
        'users.profile_photo as reviewer_photo'
      )
      .orderBy('reviews.created_at', 'desc');

    if (type === 'guide') {
      query = query.where('reviews.is_guide_review', true);
    } else if (type === 'regular') {
      query = query.where('reviews.is_guide_review', false);
    }

    const reviews = await query.limit(limit).offset(offset);

    const total = await knex('reviews')
      .where({ reviewed_id: userId })
      .count('* as count')
      .first();

    return {
      reviews,
      total: parseInt(total.count),
      hasMore: offset + reviews.length < parseInt(total.count),
    };
  }

  static async getMyReviews(userId, options = {}) {
    const { limit = 20, offset = 0 } = options;

    const reviews = await knex('reviews')
      .where({ reviewer_id: userId })
      .join('users', 'reviews.reviewed_id', 'users.id')
      .select(
        'reviews.*',
        'users.name as reviewed_name',
        'users.profile_photo as reviewed_photo'
      )
      .orderBy('reviews.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return reviews;
  }

  static async getReviewById(reviewId) {
    const review = await knex('reviews')
      .where({ id: reviewId })
      .first();

    if (!review) {
      const error = new Error('Review not found');
      error.statusCode = 404;
      error.code = 'REVIEW_NOT_FOUND';
      throw error;
    }

    return review;
  }

  static async deleteReview(reviewId, userId) {
    const review = await this.getReviewById(reviewId);

    if (review.reviewer_id !== userId) {
      const error = new Error('Cannot delete another user\'s review');
      error.statusCode = 403;
      error.code = 'REVIEW_NOT_OWNER';
      throw error;
    }

    const hoursSinceCreation = (Date.now() - new Date(review.created_at).getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      const error = new Error('Can only delete reviews within 24 hours of creation');
      error.statusCode = 400;
      error.code = 'REVIEW_DELETE_EXPIRED';
      throw error;
    }

    await knex('reviews').where({ id: reviewId }).delete();
    await this.updateUserRating(review.reviewed_id);

    return { success: true };
  }

  static async getUserRatingStats(userId) {
    const stats = await knex('reviews')
      .where({ reviewed_id: userId })
      .select(
        knex.raw('AVG(rating) as average'),
        knex.raw('COUNT(*) as total'),
        knex.raw('SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star'),
        knex.raw('SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star'),
        knex.raw('SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star'),
        knex.raw('SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star'),
        knex.raw('SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star')
      )
      .first();

    return {
      average: parseFloat(stats.average) || 0,
      total: parseInt(stats.total) || 0,
      distribution: {
        5: parseInt(stats.five_star) || 0,
        4: parseInt(stats.four_star) || 0,
        3: parseInt(stats.three_star) || 0,
        2: parseInt(stats.two_star) || 0,
        1: parseInt(stats.one_star) || 0,
      },
    };
  }
}

module.exports = ReviewService;
