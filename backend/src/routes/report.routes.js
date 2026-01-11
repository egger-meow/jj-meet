const express = require('express');
const { body, param } = require('express-validator');
const reportController = require('../controllers/report.controller');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.post(
  '/',
  [
    body('reportedId').isUUID().withMessage('Valid user ID is required'),
    body('reason')
      .isString()
      .isIn([
        'inappropriate_content',
        'harassment',
        'spam',
        'fake_profile',
        'scam',
        'dangerous_behavior',
        'underage',
        'other',
      ])
      .withMessage('Valid report reason is required'),
    body('description')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Description must be under 1000 characters'),
  ],
  reportController.createReport
);

router.get('/', reportController.getMyReports);

router.get('/reasons', reportController.getReportReasons);

router.get('/pending', reportController.getPendingReports);

router.patch(
  '/:reportId',
  [
    param('reportId').isUUID().withMessage('Valid report ID is required'),
    body('status')
      .isIn(['pending', 'reviewing', 'resolved', 'dismissed'])
      .withMessage('Valid status is required'),
    body('adminNotes').optional().isString(),
    body('actionTaken')
      .optional()
      .isIn(['warning', 'temporary_ban', 'permanent_ban', 'dismissed'])
      .withMessage('Invalid action'),
  ],
  reportController.updateReportStatus
);

module.exports = router;
