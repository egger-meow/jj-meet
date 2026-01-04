const knex = require('../config/database');
const MatchService = require('./match.service');

class SwipeService {
  static SWIPE_DIRECTIONS = {
    LIKE: 'like',
    PASS: 'pass',
    SUPER_LIKE: 'super_like'
  };

  static async createSwipe(swiperId, swipedId, direction) {
    if (!swipedId || !direction) {
      const error = new Error('Missing required fields');
      error.statusCode = 400;
      error.code = 'SWIPE_MISSING_FIELDS';
      throw error;
    }

    if (!Object.values(this.SWIPE_DIRECTIONS).includes(direction)) {
      const error = new Error('Invalid swipe direction');
      error.statusCode = 400;
      error.code = 'SWIPE_INVALID_DIRECTION';
      throw error;
    }

    if (swiperId === swipedId) {
      const error = new Error('Cannot swipe on yourself');
      error.statusCode = 400;
      error.code = 'SWIPE_SELF';
      throw error;
    }

    const existingSwipe = await knex('swipes')
      .where({ swiper_id: swiperId, swiped_id: swipedId })
      .first();

    if (existingSwipe) {
      const error = new Error('Already swiped on this user');
      error.statusCode = 400;
      error.code = 'SWIPE_DUPLICATE';
      throw error;
    }

    const targetUser = await knex('users')
      .where({ id: swipedId, is_active: true })
      .first();

    if (!targetUser) {
      const error = new Error('User not found or inactive');
      error.statusCode = 404;
      error.code = 'SWIPE_USER_NOT_FOUND';
      throw error;
    }

    const [swipe] = await knex('swipes')
      .insert({
        swiper_id: swiperId,
        swiped_id: swipedId,
        direction
      })
      .returning('*');

    let match = null;
    let isMatch = false;

    if (direction === this.SWIPE_DIRECTIONS.LIKE || direction === this.SWIPE_DIRECTIONS.SUPER_LIKE) {
      const reciprocalSwipe = await this.checkReciprocalLike(swiperId, swipedId);
      
      if (reciprocalSwipe) {
        match = await MatchService.createMatch(swiperId, swipedId);
        isMatch = true;
      }
    }

    return { swipe, match, isMatch };
  }

  static async checkReciprocalLike(userId1, userId2) {
    return knex('swipes')
      .where({
        swiper_id: userId2,
        swiped_id: userId1
      })
      .whereIn('direction', [this.SWIPE_DIRECTIONS.LIKE, this.SWIPE_DIRECTIONS.SUPER_LIKE])
      .first();
  }

  static async getSwipeHistory(userId, options = {}) {
    const { limit = 50, offset = 0, direction } = options;

    let query = knex('swipes')
      .where('swiper_id', userId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    if (direction) {
      query = query.where('direction', direction);
    }

    return query;
  }

  static async getLikesReceived(userId, options = {}) {
    const { limit = 50, offset = 0, unseenOnly = false } = options;

    let query = knex('swipes')
      .join('users', 'swipes.swiper_id', 'users.id')
      .where('swipes.swiped_id', userId)
      .whereIn('swipes.direction', [this.SWIPE_DIRECTIONS.LIKE, this.SWIPE_DIRECTIONS.SUPER_LIKE])
      .whereNotIn('swipes.swiper_id', function() {
        this.select('swiped_id')
          .from('swipes')
          .where('swiper_id', userId);
      })
      .select(
        'users.id',
        'users.name',
        'users.profile_photo',
        'users.bio',
        'users.user_type',
        'users.is_guide',
        'swipes.direction',
        'swipes.created_at as liked_at'
      )
      .orderBy('swipes.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    if (unseenOnly) {
      query = query.where('swipes.is_seen', false);
    }

    return query;
  }

  static async getDiscoveryCandidates(userId, options = {}) {
    const {
      maxDistance = 50,
      limit = 20,
      filters = {}
    } = options;

    const currentUser = await knex('users')
      .where({ id: userId })
      .first();

    if (!currentUser || !currentUser.location) {
      return [];
    }

    const swipedUserIds = await knex('swipes')
      .where('swiper_id', userId)
      .pluck('swiped_id');

    const blockedUserIds = await this.getBlockedUserIds(userId);

    const excludeIds = [...new Set([userId, ...swipedUserIds, ...blockedUserIds])];

    let query = knex('users')
      .select(
        'users.*',
        knex.raw(
          `ST_Distance(location::geography, ?::geography) / 1000 as distance`,
          [currentUser.location]
        )
      )
      .where('is_active', true)
      .whereNotIn('id', excludeIds)
      .whereRaw(
        `ST_DWithin(location::geography, ?::geography, ?)`,
        [currentUser.location, maxDistance * 1000]
      );

    if (filters.user_type) {
      query = query.where('user_type', filters.user_type);
    }
    if (filters.is_guide !== undefined) {
      query = query.where('is_guide', filters.is_guide);
    }
    if (filters.gender) {
      query = query.where('gender', filters.gender);
    }
    if (filters.has_car !== undefined) {
      query = query.where('has_car', filters.has_car);
    }
    if (filters.has_motorcycle !== undefined) {
      query = query.where('has_motorcycle', filters.has_motorcycle);
    }

    const candidates = await query
      .orderBy('distance', 'asc')
      .limit(limit);

    return candidates.map(user => {
      delete user.password;
      return user;
    });
  }

  static async getBlockedUserIds(userId) {
    try {
      const blocked = await knex('blocks')
        .where('blocker_id', userId)
        .orWhere('blocked_id', userId)
        .select('blocker_id', 'blocked_id');

      const ids = new Set();
      for (const block of blocked) {
        if (block.blocker_id !== userId) ids.add(block.blocker_id);
        if (block.blocked_id !== userId) ids.add(block.blocked_id);
      }
      return Array.from(ids);
    } catch (error) {
      return [];
    }
  }

  static async undoLastSwipe(userId) {
    const lastSwipe = await knex('swipes')
      .where('swiper_id', userId)
      .orderBy('created_at', 'desc')
      .first();

    if (!lastSwipe) {
      const error = new Error('No swipe to undo');
      error.statusCode = 404;
      error.code = 'SWIPE_NONE_TO_UNDO';
      throw error;
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (new Date(lastSwipe.created_at) < fiveMinutesAgo) {
      const error = new Error('Swipe too old to undo');
      error.statusCode = 400;
      error.code = 'SWIPE_TOO_OLD';
      throw error;
    }

    await knex('swipes')
      .where({ id: lastSwipe.id })
      .del();

    if (lastSwipe.direction === this.SWIPE_DIRECTIONS.LIKE || 
        lastSwipe.direction === this.SWIPE_DIRECTIONS.SUPER_LIKE) {
      await MatchService.removeMatchIfExists(userId, lastSwipe.swiped_id);
    }

    return lastSwipe;
  }
}

module.exports = SwipeService;
