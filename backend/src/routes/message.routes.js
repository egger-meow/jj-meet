const express = require('express');
const authMiddleware = require('../middleware/auth');
const knex = require('../config/database');

const router = express.Router();

// Get messages for a match
router.get('/:matchId', authMiddleware, async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.userId;
    const { limit = 50, offset = 0 } = req.query;

    // Verify user is part of this match
    const match = await knex('matches')
      .where('id', matchId)
      .where(function() {
        this.where('user1_id', userId).orWhere('user2_id', userId);
      })
      .first();

    if (!match) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await knex('messages')
      .where('match_id', matchId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    // Mark messages as read
    await knex('messages')
      .where('match_id', matchId)
      .whereNot('sender_id', userId)
      .andWhere('is_read', false)
      .update({
        is_read: true,
        read_at: knex.fn.now()
      });

    res.json(messages.reverse());
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message
router.post('/:matchId', authMiddleware, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { content, attachment_url, attachment_type } = req.body;
    const sender_id = req.userId;

    // Verify user is part of this match
    const match = await knex('matches')
      .where('id', matchId)
      .where(function() {
        this.where('user1_id', sender_id).orWhere('user2_id', sender_id);
      })
      .first();

    if (!match) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [message] = await knex('messages')
      .insert({
        match_id: matchId,
        sender_id,
        content,
        attachment_url,
        attachment_type
      })
      .returning('*');

    // Update last interaction
    await knex('matches')
      .where('id', matchId)
      .update({ last_interaction: knex.fn.now() });

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
