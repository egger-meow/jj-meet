const express = require('express');
const authMiddleware = require('../middleware/auth');
const swipeController = require('../controllers/swipe.controller');

const router = express.Router();

router.post('/', authMiddleware, swipeController.createSwipe);
router.get('/history', authMiddleware, swipeController.getSwipeHistory);
router.get('/likes', authMiddleware, swipeController.getLikesReceived);
router.post('/undo', authMiddleware, swipeController.undoLastSwipe);

module.exports = router;
