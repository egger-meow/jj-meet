const knex = require('../config/database');

class MatchService {
  static async createMatch(userId1, userId2) {
    const [user1_id, user2_id] = [userId1, userId2].sort();

    const existingMatch = await knex('matches')
      .where({ user1_id, user2_id })
      .first();

    if (existingMatch) {
      if (!existingMatch.is_active) {
        const [match] = await knex('matches')
          .where({ id: existingMatch.id })
          .update({ 
            is_active: true,
            matched_at: knex.fn.now(),
            last_interaction: knex.fn.now()
          })
          .returning('*');
        return match;
      }
      return existingMatch;
    }

    const [match] = await knex('matches')
      .insert({ 
        user1_id, 
        user2_id,
        matched_at: knex.fn.now(),
        last_interaction: knex.fn.now()
      })
      .returning('*');

    return match;
  }

  static async getMatches(userId, options = {}) {
    const { limit = 50, offset = 0, sortBy = 'last_interaction' } = options;

    const matches = await knex('matches')
      .where(function() {
        this.where('matches.user1_id', userId).orWhere('matches.user2_id', userId);
      })
      .andWhere('matches.is_active', true)
      .join('users', function() {
        this.on(function() {
          this.on('users.id', '=', 'matches.user1_id')
            .andOn('matches.user2_id', '=', knex.raw('?', [userId]));
        }).orOn(function() {
          this.on('users.id', '=', 'matches.user2_id')
            .andOn('matches.user1_id', '=', knex.raw('?', [userId]));
        });
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
      .orderBy(sortBy === 'matched_at' ? 'matches.matched_at' : 'matches.last_interaction', 'desc')
      .limit(limit)
      .offset(offset);

    const matchesWithUnread = await Promise.all(
      matches.map(async (match) => {
        const unreadCount = await this.getUnreadMessageCount(match.match_id, userId);
        return { ...match, unread_count: unreadCount };
      })
    );

    return matchesWithUnread;
  }

  static async getMatchById(matchId, userId) {
    const match = await knex('matches')
      .where('id', matchId)
      .where(function() {
        this.where('user1_id', userId).orWhere('user2_id', userId);
      })
      .first();

    if (!match) {
      const error = new Error('Match not found');
      error.statusCode = 404;
      error.code = 'MATCH_NOT_FOUND';
      throw error;
    }

    return match;
  }

  static async unmatch(matchId, userId) {
    const match = await this.getMatchById(matchId, userId);

    if (!match.is_active) {
      const error = new Error('Match already inactive');
      error.statusCode = 400;
      error.code = 'MATCH_ALREADY_INACTIVE';
      throw error;
    }

    await knex('matches')
      .where('id', matchId)
      .update({ 
        is_active: false,
        unmatched_at: knex.fn.now(),
        unmatched_by: userId
      });

    return { success: true, matchId };
  }

  static async removeMatchIfExists(userId1, userId2) {
    const [user1_id, user2_id] = [userId1, userId2].sort();

    await knex('matches')
      .where({ user1_id, user2_id, is_active: true })
      .update({ is_active: false });
  }

  static async getUnreadMessageCount(matchId, userId) {
    const result = await knex('messages')
      .where('match_id', matchId)
      .whereNot('sender_id', userId)
      .where('is_read', false)
      .count('id as count')
      .first();

    return parseInt(result?.count || 0);
  }

  static async getMatchStats(userId) {
    const totalMatches = await knex('matches')
      .where(function() {
        this.where('user1_id', userId).orWhere('user2_id', userId);
      })
      .where('is_active', true)
      .count('id as count')
      .first();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeChats = await knex('matches')
      .where(function() {
        this.where('user1_id', userId).orWhere('user2_id', userId);
      })
      .where('is_active', true)
      .where('last_interaction', '>', sevenDaysAgo.toISOString())
      .count('id as count')
      .first();

    return {
      totalMatches: parseInt(totalMatches?.count || 0),
      activeChats: parseInt(activeChats?.count || 0)
    };
  }

  static async isMatched(userId1, userId2) {
    const [user1_id, user2_id] = [userId1, userId2].sort();

    const match = await knex('matches')
      .where({ user1_id, user2_id, is_active: true })
      .first();

    return !!match;
  }
}

module.exports = MatchService;
