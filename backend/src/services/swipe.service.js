const knex = require('../config/database');
const MatchService = require('./match.service');
const ModerationService = require('./moderation.service');

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

  static async markLikesAsSeen(userId, likerIds = []) {
    if (likerIds.length === 0) {
      return knex('swipes')
        .where('swiped_id', userId)
        .whereIn('direction', [this.SWIPE_DIRECTIONS.LIKE, this.SWIPE_DIRECTIONS.SUPER_LIKE])
        .where('is_seen', false)
        .update({ is_seen: true });
    }

    return knex('swipes')
      .where('swiped_id', userId)
      .whereIn('swiper_id', likerIds)
      .where('is_seen', false)
      .update({ is_seen: true });
  }

  static async getUnseenLikesCount(userId) {
    const result = await knex('swipes')
      .where('swiped_id', userId)
      .whereIn('direction', [this.SWIPE_DIRECTIONS.LIKE, this.SWIPE_DIRECTIONS.SUPER_LIKE])
      .where('is_seen', false)
      .count('id as count')
      .first();

    return parseInt(result?.count || 0, 10);
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
    const shadowBannedUserIds = await ModerationService.getShadowBannedUserIds();

    const excludeIds = [...new Set([userId, ...swipedUserIds, ...blockedUserIds, ...shadowBannedUserIds])];

    let query = knex('users')
      .select(
        'users.*',
        knex.raw(
          `ST_Distance(location::geography, ?::geography) / 1000 as distance`,
          [currentUser.location]
        )
      )
      .where('is_active', true)
      .where('is_banned', false)
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

  static async getTripAwareDiscovery(userId, options = {}) {
    const {
      tripId = null,
      maxDistance = 50,
      limit = 20,
      filters = {}
    } = options;

    const swipedUserIds = await knex('swipes')
      .where('swiper_id', userId)
      .pluck('swiped_id');

    const blockedUserIds = await this.getBlockedUserIds(userId);
    const excludeIds = [...new Set([userId, ...swipedUserIds, ...blockedUserIds])];

    if (tripId) {
      return this.getDiscoveryForTrip(userId, tripId, excludeIds, maxDistance, limit, filters);
    }

    return this.getDiscoveryCandidates(userId, { maxDistance, limit, filters });
  }

  static async getDiscoveryForTrip(userId, tripId, excludeIds, maxDistance, limit, filters) {
    const trip = await knex('trips')
      .where({ id: tripId, user_id: userId })
      .first();

    if (!trip) {
      const error = new Error('Trip not found');
      error.statusCode = 404;
      error.code = 'TRIP_NOT_FOUND';
      throw error;
    }

    if (!trip.destination_geom) {
      return [];
    }

    const now = new Date().toISOString().split('T')[0];
    
    let candidatesQuery = knex('users')
      .select(
        'users.*',
        knex.raw(
          `ST_Distance(users.location::geography, ?::geography) / 1000 as distance`,
          [trip.destination_geom]
        ),
        knex.raw(`NULL as overlap_days`),
        knex.raw(`'local' as match_type`)
      )
      .where('users.is_active', true)
      .whereNotIn('users.id', excludeIds)
      .whereRaw(
        `ST_DWithin(users.location::geography, ?::geography, ?)`,
        [trip.destination_geom, maxDistance * 1000]
      );

    if (filters.user_type) {
      candidatesQuery = candidatesQuery.where('users.user_type', filters.user_type);
    }
    if (filters.is_guide !== undefined) {
      candidatesQuery = candidatesQuery.where('users.is_guide', filters.is_guide);
    }
    if (filters.gender) {
      candidatesQuery = candidatesQuery.where('users.gender', filters.gender);
    }

    const localCandidates = await candidatesQuery.limit(Math.ceil(limit / 2));

    const travelerCandidates = await knex('trips')
      .join('users', 'trips.user_id', 'users.id')
      .select(
        'users.*',
        knex.raw(
          `ST_Distance(trips.destination_geom::geography, ?::geography) / 1000 as distance`,
          [trip.destination_geom]
        ),
        knex.raw(`
          GREATEST(0, 
            LEAST(trips.end_date, ?::date) - GREATEST(trips.start_date, ?::date) + 1
          ) as overlap_days
        `, [trip.end_date, trip.start_date]),
        knex.raw(`'traveler' as match_type`)
      )
      .where('trips.is_active', true)
      .where('trips.is_public', true)
      .where('users.is_active', true)
      .whereNotIn('users.id', excludeIds)
      .where('trips.start_date', '<=', trip.end_date)
      .where('trips.end_date', '>=', trip.start_date)
      .whereRaw(
        `ST_DWithin(trips.destination_geom::geography, ?::geography, ?)`,
        [trip.destination_geom, maxDistance * 1000]
      )
      .orderByRaw('overlap_days DESC, distance ASC')
      .limit(Math.ceil(limit / 2));

    const allCandidates = [...travelerCandidates, ...localCandidates];

    const seen = new Set();
    const uniqueCandidates = allCandidates.filter(c => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });

    return uniqueCandidates.slice(0, limit).map(user => {
      delete user.password;
      return user;
    });
  }

  static calculateMatchScore(candidate, options = {}) {
    const { tripStartDate, tripEndDate } = options;
    let score = 1.0;

    if (candidate.distance !== undefined) {
      if (candidate.distance < 2) score *= 1.0;
      else if (candidate.distance < 10) score *= 0.8;
      else if (candidate.distance < 30) score *= 0.5;
      else score *= 0.2;
    }

    if (candidate.overlap_days !== undefined && candidate.overlap_days > 0) {
      if (candidate.overlap_days >= 7) score *= 1.0;
      else if (candidate.overlap_days >= 3) score *= 0.8;
      else score *= 0.5;
    }

    if (candidate.match_type === 'traveler') {
      score *= 1.1;
    }

    if (candidate.is_guide) {
      score *= 1.05;
    }

    return score;
  }
}

module.exports = SwipeService;
