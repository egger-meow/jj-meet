const express = require('express');
const authMiddleware = require('../middleware/auth');
const messageController = require('../controllers/message.controller');

const router = express.Router();

router.get('/unread', authMiddleware, messageController.getUnreadCount);
router.get('/search', authMiddleware, messageController.searchMessages);
router.get('/:matchId', authMiddleware, messageController.getMessages);
router.post('/:matchId', authMiddleware, messageController.sendMessage);
router.post('/:matchId/read', authMiddleware, messageController.markAsRead);
router.delete('/:messageId', authMiddleware, messageController.deleteMessage);

module.exports = router;
