const express = require('express');
const authMiddleware = require('../middleware/auth');
const knex = require('../config/database');

const router = express.Router();

// Get all matches for a user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    
    const matches = await knex('matches')
      .where(function() {
        this.where('user1_id', userId).orWhere('user2_id', userId);
      })
      .andWhere('is_active', true)
      .join('users', function() {
        this.on('users.id', '=', 'matches.user1_id')
          .andOn('matches.user2_id', '=', knex.raw('?', [userId]))
          .orOn('users.id', '=', 'matches.user2_id')
          .andOn('matches.user1_id', '=', knex.raw('?', [userId]));
      })
      .select(
        'matches.id as match_id',
        'matches.matched_at',
        'matches.last_interaction',
        'users.id',
        'users.name',
        'users.profile_photo',
        'users.bio',
        'users.user_type',
        'users.is_guide',
        'users.has_car',
        'users.has_motorcycle',
        'users.last_active'
      )
      .orderBy('matches.last_interaction', 'desc');

    res.json(matches);
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Unmatch with someone
router.delete('/:matchId', authMiddleware, async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.userId;

    // Verify user is part of this match
    const match = await knex('matches')
      .where('id', matchId)
      .where(function() {
        this.where('user1_id', userId).orWhere('user2_id', userId);
      })
      .first();

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Soft delete the match
    await knex('matches')
      .where('id', matchId)
      .update({ is_active: false });

    res.json({ message: 'Unmatched successfully' });
  } catch (error) {
    console.error('Unmatch error:', error);
    res.status(500).json({ error: 'Failed to unmatch' });
  }
});

module.exports = router;
