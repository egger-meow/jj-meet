const express = require('express');
const authMiddleware = require('../middleware/auth');
const knex = require('../config/database');

const router = express.Router();

// Create a swipe
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { swiped_id, direction } = req.body;
    const swiper_id = req.userId;

    if (!swiped_id || !direction) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if already swiped
    const existingSwipe = await knex('swipes')
      .where({ swiper_id, swiped_id })
      .first();

    if (existingSwipe) {
      return res.status(400).json({ error: 'Already swiped on this user' });
    }

    // Create swipe
    const [swipe] = await knex('swipes')
      .insert({ swiper_id, swiped_id, direction })
      .returning('*');

    // Check for match if it's a like
    if (direction === 'like' || direction === 'super_like') {
      const reciprocalSwipe = await knex('swipes')
        .where({
          swiper_id: swiped_id,
          swiped_id: swiper_id
        })
        .whereIn('direction', ['like', 'super_like'])
        .first();

      if (reciprocalSwipe) {
        // Create match
        const [user1_id, user2_id] = [swiper_id, swiped_id].sort();
        
        const [match] = await knex('matches')
          .insert({ user1_id, user2_id })
          .returning('*');

        return res.json({
          swipe,
          match: match,
          isMatch: true
        });
      }
    }

    res.json({ swipe, isMatch: false });
  } catch (error) {
    console.error('Swipe error:', error);
    res.status(500).json({ error: 'Failed to process swipe' });
  }
});

// Get swipe history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const swipes = await knex('swipes')
      .where('swiper_id', req.userId)
      .orderBy('created_at', 'desc')
      .limit(50);

    res.json(swipes);
  } catch (error) {
    console.error('Get swipe history error:', error);
    res.status(500).json({ error: 'Failed to fetch swipe history' });
  }
});

// Get who liked me
router.get('/likes', authMiddleware, async (req, res) => {
  try {
    const likes = await knex('swipes')
      .join('users', 'swipes.swiper_id', 'users.id')
      .where('swipes.swiped_id', req.userId)
      .whereIn('swipes.direction', ['like', 'super_like'])
      .whereNotIn('swipes.swiper_id', function() {
        this.select('swiped_id')
          .from('swipes')
          .where('swiper_id', req.userId);
      })
      .select(
        'users.id',
        'users.name',
        'users.profile_photo',
        'users.bio',
        'users.age',
        'swipes.direction',
        'swipes.created_at'
      )
      .orderBy('swipes.created_at', 'desc');

    res.json(likes);
  } catch (error) {
    console.error('Get likes error:', error);
    res.status(500).json({ error: 'Failed to fetch likes' });
  }
});

module.exports = router;
