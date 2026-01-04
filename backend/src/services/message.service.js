const knex = require('../config/database');
const MatchService = require('./match.service');

class MessageService {
  static async sendMessage(matchId, senderId, messageData) {
    const { content, attachment_url, attachment_type } = messageData;

    if (!content && !attachment_url) {
      const error = new Error('Message content or attachment required');
      error.statusCode = 400;
      error.code = 'MESSAGE_EMPTY';
      throw error;
    }

    const match = await MatchService.getMatchById(matchId, senderId);

    if (!match.is_active) {
      const error = new Error('Cannot send message to inactive match');
      error.statusCode = 400;
      error.code = 'MESSAGE_MATCH_INACTIVE';
      throw error;
    }

    const [message] = await knex('messages')
      .insert({
        match_id: matchId,
        sender_id: senderId,
        content: content?.trim(),
        attachment_url,
        attachment_type
      })
      .returning('*');

    await knex('matches')
      .where('id', matchId)
      .update({ last_interaction: knex.fn.now() });

    return message;
  }

  static async getMessages(matchId, userId, options = {}) {
    const { limit = 50, offset = 0, before, after } = options;

    await MatchService.getMatchById(matchId, userId);

    let query = knex('messages')
      .where('match_id', matchId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    if (before) {
      query = query.where('created_at', '<', before);
    }

    if (after) {
      query = query.where('created_at', '>', after);
    }

    const messages = await query;

    await this.markMessagesAsRead(matchId, userId);

    return messages.reverse();
  }

  static async markMessagesAsRead(matchId, userId) {
    await knex('messages')
      .where('match_id', matchId)
      .whereNot('sender_id', userId)
      .where('is_read', false)
      .update({
        is_read: true,
        read_at: knex.fn.now()
      });
  }

  static async markMessageAsRead(messageId, userId) {
    const message = await knex('messages')
      .where({ id: messageId })
      .first();

    if (!message) {
      const error = new Error('Message not found');
      error.statusCode = 404;
      error.code = 'MESSAGE_NOT_FOUND';
      throw error;
    }

    if (message.sender_id === userId) {
      return message;
    }

    const [updated] = await knex('messages')
      .where({ id: messageId })
      .update({
        is_read: true,
        read_at: knex.fn.now()
      })
      .returning('*');

    return updated;
  }

  static async deleteMessage(messageId, userId) {
    const message = await knex('messages')
      .where({ id: messageId, sender_id: userId })
      .first();

    if (!message) {
      const error = new Error('Message not found or not authorized');
      error.statusCode = 404;
      error.code = 'MESSAGE_NOT_FOUND';
      throw error;
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (new Date(message.created_at) < fiveMinutesAgo) {
      const error = new Error('Message too old to delete');
      error.statusCode = 400;
      error.code = 'MESSAGE_TOO_OLD';
      throw error;
    }

    await knex('messages')
      .where({ id: messageId })
      .update({
        content: '[Message deleted]',
        is_deleted: true,
        deleted_at: knex.fn.now()
      });

    return { success: true, messageId };
  }

  static async getUnreadCount(userId) {
    const matches = await knex('matches')
      .where(function() {
        this.where('user1_id', userId).orWhere('user2_id', userId);
      })
      .where('is_active', true)
      .pluck('id');

    if (matches.length === 0) {
      return 0;
    }

    const result = await knex('messages')
      .whereIn('match_id', matches)
      .whereNot('sender_id', userId)
      .where('is_read', false)
      .count('id as count')
      .first();

    return parseInt(result?.count || 0);
  }

  static async getLastMessage(matchId) {
    return knex('messages')
      .where('match_id', matchId)
      .orderBy('created_at', 'desc')
      .first();
  }

  static async searchMessages(userId, searchTerm, options = {}) {
    const { limit = 20, matchId } = options;

    const userMatches = await knex('matches')
      .where(function() {
        this.where('user1_id', userId).orWhere('user2_id', userId);
      })
      .where('is_active', true)
      .pluck('id');

    if (userMatches.length === 0) {
      return [];
    }

    let query = knex('messages')
      .whereIn('match_id', userMatches)
      .whereRaw('content ILIKE ?', [`%${searchTerm}%`])
      .orderBy('created_at', 'desc')
      .limit(limit);

    if (matchId) {
      query = query.where('match_id', matchId);
    }

    return query;
  }
}

module.exports = MessageService;
