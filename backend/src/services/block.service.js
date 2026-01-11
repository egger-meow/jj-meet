const knex = require('../config/database');

class BlockService {
  static async blockUser(blockerId, blockedId, reason = null) {
    if (blockerId === blockedId) {
      const error = new Error('Cannot block yourself');
      error.statusCode = 400;
      error.code = 'BLOCK_SELF';
      throw error;
    }

    const existingBlock = await knex('blocks')
      .where({ blocker_id: blockerId, blocked_id: blockedId })
      .first();

    if (existingBlock) {
      const error = new Error('User already blocked');
      error.statusCode = 400;
      error.code = 'BLOCK_ALREADY_EXISTS';
      throw error;
    }

    const [block] = await knex('blocks')
      .insert({
        blocker_id: blockerId,
        blocked_id: blockedId,
        reason,
      })
      .returning('*');

    await this.deactivateMatch(blockerId, blockedId);

    return block;
  }

  static async unblockUser(blockerId, blockedId) {
    const deleted = await knex('blocks')
      .where({ blocker_id: blockerId, blocked_id: blockedId })
      .del();

    if (!deleted) {
      const error = new Error('Block not found');
      error.statusCode = 404;
      error.code = 'BLOCK_NOT_FOUND';
      throw error;
    }

    return { unblocked: true, blockedId };
  }

  static async getBlockedUsers(userId) {
    return knex('blocks')
      .join('users', 'blocks.blocked_id', 'users.id')
      .where('blocks.blocker_id', userId)
      .select(
        'users.id',
        'users.name',
        'users.profile_photo',
        'blocks.reason',
        'blocks.created_at as blocked_at'
      )
      .orderBy('blocks.created_at', 'desc');
  }

  static async getBlockedByUsers(userId) {
    return knex('blocks')
      .where('blocked_id', userId)
      .pluck('blocker_id');
  }

  static async isBlocked(userId1, userId2) {
    const block = await knex('blocks')
      .where(function() {
        this.where({ blocker_id: userId1, blocked_id: userId2 })
          .orWhere({ blocker_id: userId2, blocked_id: userId1 });
      })
      .first();

    return !!block;
  }

  static async getBlockedUserIds(userId) {
    const blockedByMe = await knex('blocks')
      .where('blocker_id', userId)
      .pluck('blocked_id');

    const blockedMe = await knex('blocks')
      .where('blocked_id', userId)
      .pluck('blocker_id');

    return [...new Set([...blockedByMe, ...blockedMe])];
  }

  static async deactivateMatch(userId1, userId2) {
    const [id1, id2] = [userId1, userId2].sort();

    await knex('matches')
      .where({ user1_id: id1, user2_id: id2 })
      .update({ is_active: false });
  }

  static async getBlockCount(userId) {
    const result = await knex('blocks')
      .where('blocker_id', userId)
      .count('id as count')
      .first();

    return parseInt(result?.count || 0, 10);
  }
}

module.exports = BlockService;
