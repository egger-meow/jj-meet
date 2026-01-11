const express = require('express');
const { body, param } = require('express-validator');
const blockController = require('../controllers/block.controller');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.post(
  '/',
  [
    body('blockedId').isUUID().withMessage('Valid user ID is required'),
    body('reason').optional().isString().isLength({ max: 100 }).withMessage('Reason must be under 100 characters'),
  ],
  blockController.blockUser
);

router.delete(
  '/:blockedId',
  [param('blockedId').isUUID().withMessage('Valid user ID is required')],
  blockController.unblockUser
);

router.get('/', blockController.getBlockedUsers);

router.get(
  '/check/:userId',
  [param('userId').isUUID().withMessage('Valid user ID is required')],
  blockController.checkBlocked
);

module.exports = router;
