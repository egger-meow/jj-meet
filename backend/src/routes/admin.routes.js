const express = require('express');
const { body, param, query } = require('express-validator');
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

router.use(authMiddleware);
router.use(adminAuth);

router.get('/stats', adminController.getDashboardStats);

router.get('/reports', adminController.getReports);

router.get(
  '/reports/:reportId',
  [param('reportId').isUUID().withMessage('Valid report ID is required')],
  adminController.getReportById
);

router.patch(
  '/reports/:reportId',
  [
    param('reportId').isUUID().withMessage('Valid report ID is required'),
    body('status')
      .isIn(['pending', 'reviewing', 'resolved', 'dismissed'])
      .withMessage('Valid status is required'),
    body('adminNotes').optional().isString(),
    body('actionTaken')
      .optional()
      .isIn(['warning', 'shadow_ban', 'temporary_ban', 'permanent_ban', 'dismissed']),
  ],
  adminController.updateReport
);

router.get('/users', adminController.getUsers);

router.get(
  '/users/:userId',
  [param('userId').isUUID().withMessage('Valid user ID is required')],
  adminController.getUserById
);

router.post(
  '/users/:userId/ban',
  [
    param('userId').isUUID().withMessage('Valid user ID is required'),
    body('reason').isString().notEmpty().withMessage('Reason is required'),
  ],
  adminController.banUser
);

router.post(
  '/users/:userId/unban',
  [param('userId').isUUID().withMessage('Valid user ID is required')],
  adminController.unbanUser
);

router.post(
  '/users/:userId/shadow-ban',
  [
    param('userId').isUUID().withMessage('Valid user ID is required'),
    body('reason')
      .isIn([
        'spam',
        'harassment',
        'fake_profile',
        'scam',
        'inappropriate_content',
        'multiple_reports',
        'suspicious_activity',
        'policy_violation',
      ])
      .withMessage('Valid reason is required'),
    body('durationDays').optional().isInt({ min: 1, max: 365 }),
  ],
  adminController.shadowBanUser
);

router.post(
  '/users/:userId/remove-shadow-ban',
  [param('userId').isUUID().withMessage('Valid user ID is required')],
  adminController.removeShadowBan
);

router.post(
  '/users/:userId/revoke-verification',
  [
    param('userId').isUUID().withMessage('Valid user ID is required'),
    body('reason').isString().notEmpty().withMessage('Reason is required'),
  ],
  adminController.revokeVerification
);

module.exports = router;
