const knex = require('../config/database');

class MeetingService {
  static CATEGORIES = ['cafe', 'restaurant', 'park', 'landmark', 'shopping', 'bar'];

  static async suggestLocations(matchId, userId, options = {}) {
    const { lat, lng, radius = 5, category, limit = 10 } = options;

    const match = await knex('matches')
      .where({ id: matchId })
      .where(function() {
        this.where('user1_id', userId).orWhere('user2_id', userId);
      })
      .first();

    if (!match) {
      const error = new Error('Match not found');
      error.statusCode = 404;
      error.code = 'MEETING_MATCH_NOT_FOUND';
      throw error;
    }

    let query = knex('meeting_locations')
      .select(
        '*',
        knex.raw(
          `ST_Distance(location::geography, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography) / 1000 as distance`,
          [lng, lat]
        )
      )
      .whereRaw(
        `ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)`,
        [lng, lat, radius * 1000]
      )
      .orderBy('safety_score', 'desc')
      .orderBy('distance', 'asc');

    if (category) {
      query = query.where('category', category);
    }

    const locations = await query.limit(limit);

    return locations;
  }

  static async createProposal(proposerId, matchId, data) {
    const match = await knex('matches')
      .where({ id: matchId })
      .where(function() {
        this.where('user1_id', proposerId).orWhere('user2_id', proposerId);
      })
      .first();

    if (!match) {
      const error = new Error('Match not found');
      error.statusCode = 404;
      error.code = 'MEETING_MATCH_NOT_FOUND';
      throw error;
    }

    const existingPending = await knex('meeting_proposals')
      .where({ match_id: matchId, status: 'pending' })
      .first();

    if (existingPending) {
      const error = new Error('A pending meeting proposal already exists for this match');
      error.statusCode = 400;
      error.code = 'MEETING_PROPOSAL_EXISTS';
      throw error;
    }

    const proposalData = {
      proposer_id: proposerId,
      match_id: matchId,
      proposed_time: data.proposed_time,
      message: data.message,
      status: 'pending',
    };

    if (data.location_id) {
      proposalData.location_id = data.location_id;
    } else if (data.custom_location) {
      proposalData.custom_location_name = data.custom_location.name;
      proposalData.custom_location_address = data.custom_location.address;
      if (data.custom_location.lat && data.custom_location.lng) {
        proposalData.custom_location = knex.raw(
          `ST_SetSRID(ST_MakePoint(?, ?), 4326)`,
          [data.custom_location.lng, data.custom_location.lat]
        );
      }
    }

    const [proposal] = await knex('meeting_proposals')
      .insert(proposalData)
      .returning('*');

    return proposal;
  }

  static async respondToProposal(proposalId, userId, response) {
    const proposal = await knex('meeting_proposals')
      .where({ id: proposalId })
      .first();

    if (!proposal) {
      const error = new Error('Proposal not found');
      error.statusCode = 404;
      error.code = 'MEETING_PROPOSAL_NOT_FOUND';
      throw error;
    }

    const match = await knex('matches')
      .where({ id: proposal.match_id })
      .first();

    const isRecipient = 
      (match.user1_id === userId && match.user2_id === proposal.proposer_id) ||
      (match.user2_id === userId && match.user1_id === proposal.proposer_id);

    if (!isRecipient) {
      const error = new Error('Not authorized to respond to this proposal');
      error.statusCode = 403;
      error.code = 'MEETING_NOT_AUTHORIZED';
      throw error;
    }

    if (proposal.status !== 'pending') {
      const error = new Error('This proposal has already been responded to');
      error.statusCode = 400;
      error.code = 'MEETING_ALREADY_RESPONDED';
      throw error;
    }

    const [updated] = await knex('meeting_proposals')
      .where({ id: proposalId })
      .update({
        status: response,
        responded_at: knex.fn.now(),
      })
      .returning('*');

    return updated;
  }

  static async getProposalsForMatch(matchId, userId) {
    const match = await knex('matches')
      .where({ id: matchId })
      .where(function() {
        this.where('user1_id', userId).orWhere('user2_id', userId);
      })
      .first();

    if (!match) {
      const error = new Error('Match not found');
      error.statusCode = 404;
      error.code = 'MEETING_MATCH_NOT_FOUND';
      throw error;
    }

    const proposals = await knex('meeting_proposals')
      .where({ match_id: matchId })
      .leftJoin('meeting_locations', 'meeting_proposals.location_id', 'meeting_locations.id')
      .leftJoin('users', 'meeting_proposals.proposer_id', 'users.id')
      .select(
        'meeting_proposals.*',
        'meeting_locations.name as location_name',
        'meeting_locations.address as location_address',
        'meeting_locations.category as location_category',
        'users.name as proposer_name'
      )
      .orderBy('meeting_proposals.created_at', 'desc');

    return proposals;
  }

  static async getMeetingHistory(userId, options = {}) {
    const { limit = 20, offset = 0 } = options;

    const proposals = await knex('meeting_proposals')
      .join('matches', 'meeting_proposals.match_id', 'matches.id')
      .where(function() {
        this.where('matches.user1_id', userId).orWhere('matches.user2_id', userId);
      })
      .where('meeting_proposals.status', 'accepted')
      .leftJoin('meeting_locations', 'meeting_proposals.location_id', 'meeting_locations.id')
      .select(
        'meeting_proposals.*',
        'meeting_locations.name as location_name',
        'meeting_locations.address as location_address'
      )
      .orderBy('meeting_proposals.proposed_time', 'desc')
      .limit(limit)
      .offset(offset);

    return proposals;
  }

  static async addLocation(locationData) {
    const [location] = await knex('meeting_locations')
      .insert({
        name: locationData.name,
        address: locationData.address,
        location: knex.raw(
          `ST_SetSRID(ST_MakePoint(?, ?), 4326)`,
          [locationData.lng, locationData.lat]
        ),
        city: locationData.city,
        country: locationData.country,
        category: locationData.category,
        safety_score: locationData.safety_score || 3,
        google_place_id: locationData.google_place_id,
        metadata: JSON.stringify(locationData.metadata || {}),
      })
      .returning('*');

    return location;
  }
}

module.exports = MeetingService;
