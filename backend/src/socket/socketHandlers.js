const jwt = require('jsonwebtoken');
const knex = require('../config/database');

const activeUsers = new Map();

const setupSocketHandlers = (io) => {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);
    
    // Store active user
    activeUsers.set(socket.userId, socket.id);
    
    // Join user's personal room
    socket.join(socket.userId);

    // Join match rooms
    socket.on('join-matches', async () => {
      try {
        const matches = await knex('matches')
          .where(function() {
            this.where('user1_id', socket.userId)
              .orWhere('user2_id', socket.userId);
          })
          .andWhere('is_active', true)
          .pluck('id');

        matches.forEach(matchId => {
          socket.join(`match-${matchId}`);
        });
      } catch (error) {
        console.error('Error joining match rooms:', error);
      }
    });

    // Send message
    socket.on('send-message', async (data) => {
      try {
        const { matchId, content, attachment_url, attachment_type } = data;

        // Verify user is part of this match
        const match = await knex('matches')
          .where('id', matchId)
          .where(function() {
            this.where('user1_id', socket.userId)
              .orWhere('user2_id', socket.userId);
          })
          .first();

        if (!match) {
          return socket.emit('error', 'Unauthorized');
        }

        // Save message
        const [message] = await knex('messages')
          .insert({
            match_id: matchId,
            sender_id: socket.userId,
            content,
            attachment_url,
            attachment_type
          })
          .returning('*');

        // Update last interaction
        await knex('matches')
          .where('id', matchId)
          .update({ last_interaction: knex.fn.now() });

        // Get sender info
        const sender = await knex('users')
          .where('id', socket.userId)
          .select('id', 'name', 'profile_photo')
          .first();

        const messageWithSender = { ...message, sender };

        // Emit to all users in the match room
        io.to(`match-${matchId}`).emit('new-message', messageWithSender);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', 'Failed to send message');
      }
    });

    // Typing indicators
    socket.on('typing-start', ({ matchId }) => {
      socket.to(`match-${matchId}`).emit('user-typing', {
        userId: socket.userId,
        matchId
      });
    });

    socket.on('typing-stop', ({ matchId }) => {
      socket.to(`match-${matchId}`).emit('user-stopped-typing', {
        userId: socket.userId,
        matchId
      });
    });

    // Mark messages as read
    socket.on('mark-read', async ({ matchId }) => {
      try {
        await knex('messages')
          .where('match_id', matchId)
          .whereNot('sender_id', socket.userId)
          .andWhere('is_read', false)
          .update({
            is_read: true,
            read_at: knex.fn.now()
          });

        socket.to(`match-${matchId}`).emit('messages-read', {
          matchId,
          readBy: socket.userId
        });
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    // Handle new match notification
    socket.on('new-match', async ({ matchedUserId }) => {
      const matchedSocketId = activeUsers.get(matchedUserId);
      if (matchedSocketId) {
        io.to(matchedSocketId).emit('match-notification', {
          userId: socket.userId
        });
      }
    });

    // Update location
    socket.on('update-location', async ({ latitude, longitude }) => {
      try {
        await knex.raw(
          `UPDATE users SET location = ST_SetSRID(ST_MakePoint(?, ?), 4326), last_active = NOW() WHERE id = ?`,
          [longitude, latitude, socket.userId]
        );
      } catch (error) {
        console.error('Update location error:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
      activeUsers.delete(socket.userId);
    });
  });
};

module.exports = { setupSocketHandlers };
