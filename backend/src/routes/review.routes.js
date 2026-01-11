const express = require('express');
const { body, param } = require('express-validator');
const reviewController = require('../controllers/review.controller');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.post(
  '/',
  [
    body('reviewed_id').isUUID().withMessage('Valid user ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isString().isLength({ max: 500 }),
    body('is_guide_review').optional().isBoolean(),
  ],
  reviewController.createReview
);

router.get('/mine', reviewController.getMyReviews);

router.get(
  '/user/:userId',
  [param('userId').isUUID().withMessage('Valid user ID is required')],
  reviewController.getReviewsForUser
);

router.get(
  '/user/:userId/stats',
  [param('userId').isUUID().withMessage('Valid user ID is required')],
  reviewController.getUserRatingStats
);

router.delete(
  '/:reviewId',
  [param('reviewId').isUUID().withMessage('Valid review ID is required')],
  reviewController.deleteReview
);

module.exports = router;
