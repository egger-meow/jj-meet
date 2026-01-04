const knex = require('../config/database');

class TripService {
  static async createTrip(userId, tripData) {
    const {
      destination_name,
      destination_city,
      destination_country,
      latitude,
      longitude,
      start_date,
      end_date,
      description,
      travel_style,
      preferences,
    } = tripData;

    if (!destination_name || !start_date || !end_date) {
      const error = new Error('Destination and dates are required');
      error.statusCode = 400;
      error.code = 'TRIP_MISSING_FIELDS';
      throw error;
    }

    if (new Date(start_date) > new Date(end_date)) {
      const error = new Error('Start date must be before end date');
      error.statusCode = 400;
      error.code = 'TRIP_INVALID_DATES';
      throw error;
    }

    const tripInsert = {
      user_id: userId,
      destination_name,
      destination_city,
      destination_country,
      start_date,
      end_date,
      description,
      travel_style,
      preferences: preferences ? JSON.stringify(preferences) : null,
      is_active: true,
    };

    if (latitude && longitude) {
      tripInsert.destination_geom = knex.raw(
        `ST_SetSRID(ST_MakePoint(?, ?), 4326)`,
        [longitude, latitude]
      );
    }

    const [trip] = await knex('trips')
      .insert(tripInsert)
      .returning('*');

    return trip;
  }

  static async getUserTrips(userId, options = {}) {
    const { includeInactive = false, limit = 20, offset = 0 } = options;

    let query = knex('trips')
      .where({ user_id: userId })
      .orderBy('start_date', 'desc')
      .limit(limit)
      .offset(offset);

    if (!includeInactive) {
      query = query.where('is_active', true);
    }

    return query;
  }

  static async getTripById(tripId, userId) {
    const trip = await knex('trips')
      .where({ id: tripId })
      .first();

    if (!trip) {
      const error = new Error('Trip not found');
      error.statusCode = 404;
      error.code = 'TRIP_NOT_FOUND';
      throw error;
    }

    if (trip.user_id !== userId && !trip.is_public) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      error.code = 'TRIP_ACCESS_DENIED';
      throw error;
    }

    return trip;
  }

  static async updateTrip(tripId, userId, updates) {
    const trip = await this.getTripById(tripId, userId);

    if (trip.user_id !== userId) {
      const error = new Error('Only trip owner can update');
      error.statusCode = 403;
      error.code = 'TRIP_NOT_OWNER';
      throw error;
    }

    const allowedFields = [
      'destination_name', 'destination_city', 'destination_country',
      'start_date', 'end_date', 'description', 'travel_style',
      'is_active', 'is_public', 'preferences',
    ];

    const sanitizedUpdates = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        if (key === 'preferences') {
          sanitizedUpdates[key] = JSON.stringify(updates[key]);
        } else {
          sanitizedUpdates[key] = updates[key];
        }
      }
    }

    if (updates.latitude && updates.longitude) {
      sanitizedUpdates.destination_geom = knex.raw(
        `ST_SetSRID(ST_MakePoint(?, ?), 4326)`,
        [updates.longitude, updates.latitude]
      );
    }

    sanitizedUpdates.updated_at = knex.fn.now();

    const [updated] = await knex('trips')
      .where({ id: tripId })
      .update(sanitizedUpdates)
      .returning('*');

    return updated;
  }

  static async deleteTrip(tripId, userId) {
    const trip = await this.getTripById(tripId, userId);

    if (trip.user_id !== userId) {
      const error = new Error('Only trip owner can delete');
      error.statusCode = 403;
      error.code = 'TRIP_NOT_OWNER';
      throw error;
    }

    await knex('trips').where({ id: tripId }).del();

    return { deleted: true, tripId };
  }

  static async getActiveTrip(userId) {
    const now = new Date().toISOString().split('T')[0];

    return knex('trips')
      .where({ user_id: userId, is_active: true })
      .where('start_date', '<=', now)
      .where('end_date', '>=', now)
      .orderBy('start_date', 'asc')
      .first();
  }

  static async getUpcomingTrips(userId, daysAhead = 30) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return knex('trips')
      .where({ user_id: userId, is_active: true })
      .where('start_date', '>', now.toISOString().split('T')[0])
      .where('start_date', '<=', futureDate.toISOString().split('T')[0])
      .orderBy('start_date', 'asc');
  }

  static async findOverlappingTravelers(tripId, userId, options = {}) {
    const { maxDistance = 50, limit = 20 } = options;

    const trip = await this.getTripById(tripId, userId);

    if (!trip.destination_geom) {
      return [];
    }

    const overlappingTrips = await knex('trips')
      .join('users', 'trips.user_id', 'users.id')
      .where('trips.is_active', true)
      .where('trips.is_public', true)
      .whereNot('trips.user_id', userId)
      .where('users.is_active', true)
      .where('trips.start_date', '<=', trip.end_date)
      .where('trips.end_date', '>=', trip.start_date)
      .whereRaw(
        `ST_DWithin(trips.destination_geom::geography, ?::geography, ?)`,
        [trip.destination_geom, maxDistance * 1000]
      )
      .select(
        'trips.*',
        'users.id as user_id',
        'users.name',
        'users.profile_photo',
        'users.bio',
        'users.user_type',
        'users.is_guide',
        knex.raw(
          `ST_Distance(trips.destination_geom::geography, ?::geography) / 1000 as distance`,
          [trip.destination_geom]
        )
      )
      .orderBy('distance', 'asc')
      .limit(limit);

    return overlappingTrips;
  }

  static async calculateOverlapDays(trip1Start, trip1End, trip2Start, trip2End) {
    const start = new Date(Math.max(new Date(trip1Start), new Date(trip2Start)));
    const end = new Date(Math.min(new Date(trip1End), new Date(trip2End)));
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays + 1);
  }
}

module.exports = TripService;
