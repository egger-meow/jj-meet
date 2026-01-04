const express = require('express');
const authMiddleware = require('../middleware/auth');
const matchController = require('../controllers/match.controller');

const router = express.Router();

router.get('/', authMiddleware, matchController.getMatches);
router.get('/stats', authMiddleware, matchController.getMatchStats);
router.get('/:matchId', authMiddleware, matchController.getMatchById);
router.delete('/:matchId', authMiddleware, matchController.unmatch);

module.exports = router;
