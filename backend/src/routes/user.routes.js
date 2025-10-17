const express = require('express');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Get nearby users for swiping
router.get('/nearby', authMiddleware, async (req, res) => {
  try {
    const { 
      maxDistance = 50, 
      user_type, 
      is_guide, 
      gender,
      has_car,
      has_motorcycle 
    } = req.query;

    const filters = {};
    if (user_type) filters.user_type = user_type;
    if (is_guide !== undefined) filters.is_guide = is_guide === 'true';
    if (gender) filters.gender = gender;
    if (has_car !== undefined) filters.has_car = has_car === 'true';
    if (has_motorcycle !== undefined) filters.has_motorcycle = has_motorcycle === 'true';

    const users = await User.getNearbyUsers(
      req.userId, 
      parseInt(maxDistance),
      filters
    );

    res.json(users);
  } catch (error) {
    console.error('Get nearby users error:', error);
    res.status(500).json({ error: 'Failed to fetch nearby users' });
  }
});

// Update user location
router.post('/location', authMiddleware, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Location coordinates required' });
    }

    await User.updateLocation(req.userId, latitude, longitude);
    res.json({ message: 'Location updated successfully' });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// Get user by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    delete user.password;
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
