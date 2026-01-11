const ReviewService = require('../services/review.service');
const { validationResult } = require('express-validator');

exports.createReview = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { reviewed_id, rating, comment, is_guide_review } = req.body;
    
    const review = await ReviewService.createReview(req.userId, reviewed_id, {
      rating,
      comment,
      is_guide_review,
    });

    res.status(201).json({
      success: true,
      data: review,
      message: 'Review created successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.getReviewsForUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit, offset, type } = req.query;

    const result = await ReviewService.getReviewsForUser(userId, {
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
      type,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.getMyReviews = async (req, res, next) => {
  try {
    const { limit, offset } = req.query;

    const reviews = await ReviewService.getMyReviews(req.userId, {
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
    });

    res.json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    await ReviewService.deleteReview(reviewId, req.userId);

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getUserRatingStats = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const stats = await ReviewService.getUserRatingStats(userId);

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};
