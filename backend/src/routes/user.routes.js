const express = require('express');
const authMiddleware = require('../middleware/auth');
const userController = require('../controllers/user.controller');

const router = express.Router();

router.get('/nearby', authMiddleware, userController.getNearbyUsers);
router.get('/discover', authMiddleware, userController.getDiscoveryCandidates);
router.get('/completeness', authMiddleware, userController.getProfileCompleteness);
router.get('/guides/search', authMiddleware, userController.searchGuides);
router.get('/guides/:userId', authMiddleware, userController.getGuideProfile);
router.patch('/guide-profile', authMiddleware, userController.updateGuideProfile);
router.post('/location', authMiddleware, userController.updateLocation);
router.post('/guide-mode', authMiddleware, userController.setGuideMode);
router.post('/deactivate', authMiddleware, userController.deactivateAccount);
router.get('/:id', authMiddleware, userController.getUserById);

module.exports = router;
