const knex = require('../config/database');

class ModerationService {
  static BAN_TYPES = {
    SHADOW: 'shadow',
    FULL: 'full',
  };

  static SHADOW_BAN_REASONS = [
    'spam',
    'harassment',
    'fake_profile',
    'scam',
    'inappropriate_content',
    'multiple_reports',
    'suspicious_activity',
    'policy_violation',
  ];

  static async shadowBanUser(userId, reason, durationDays = null, adminId = null) {
    if (!this.SHADOW_BAN_REASONS.includes(reason)) {
      const error = new Error('Invalid shadow ban reason');
      error.statusCode = 400;
      error.code = 'MODERATION_INVALID_REASON';
      throw error;
    }

    const shadowBanUntil = durationDays 
      ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
      : null;

    const [user] = await knex('users')
      .where({ id: userId })
      .update({
        is_shadow_banned: true,
        shadow_ban_reason: reason,
        shadow_ban_until: shadowBanUntil,
      })
      .returning(['id', 'email', 'name', 'is_shadow_banned', 'shadow_ban_reason', 'shadow_ban_until']);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    await this.logModerationAction(userId, 'shadow_ban', reason, adminId);

    return user;
  }

  static async removeShadowBan(userId, adminId = null) {
    const [user] = await knex('users')
      .where({ id: userId })
      .update({
        is_shadow_banned: false,
        shadow_ban_reason: null,
        shadow_ban_until: null,
      })
      .returning(['id', 'email', 'name', 'is_shadow_banned']);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    await this.logModerationAction(userId, 'shadow_ban_removed', null, adminId);

    return user;
  }

  static async banUser(userId, reason, adminId = null) {
    const [user] = await knex('users')
      .where({ id: userId })
      .update({
        is_banned: true,
        ban_reason: reason,
        banned_at: knex.fn.now(),
        is_active: false,
      })
      .returning(['id', 'email', 'name', 'is_banned', 'ban_reason']);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    await this.logModerationAction(userId, 'ban', reason, adminId);

    return user;
  }

  static async unbanUser(userId, adminId = null) {
    const [user] = await knex('users')
      .where({ id: userId })
      .update({
        is_banned: false,
        ban_reason: null,
        banned_at: null,
        is_active: true,
      })
      .returning(['id', 'email', 'name', 'is_banned']);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    await this.logModerationAction(userId, 'unban', null, adminId);

    return user;
  }

  static async isShadowBanned(userId) {
    const user = await knex('users')
      .where({ id: userId })
      .select('is_shadow_banned', 'shadow_ban_until')
      .first();

    if (!user) return false;

    if (user.is_shadow_banned) {
      if (user.shadow_ban_until && new Date(user.shadow_ban_until) < new Date()) {
        await this.removeShadowBan(userId);
        return false;
      }
      return true;
    }

    return false;
  }

  static async isBanned(userId) {
    const user = await knex('users')
      .where({ id: userId })
      .select('is_banned')
      .first();

    return !!user?.is_banned;
  }

  static async getShadowBannedUserIds() {
    const users = await knex('users')
      .where('is_shadow_banned', true)
      .where(function() {
        this.whereNull('shadow_ban_until')
          .orWhere('shadow_ban_until', '>', knex.fn.now());
      })
      .pluck('id');

    return users;
  }

  static async getUserModerationStatus(userId) {
    const user = await knex('users')
      .where({ id: userId })
      .select(
        'is_shadow_banned',
        'shadow_ban_reason',
        'shadow_ban_until',
        'is_banned',
        'ban_reason',
        'banned_at'
      )
      .first();

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    return user;
  }

  static async autoModerateUser(userId) {
    const reportCount = await knex('reports')
      .where('reported_id', userId)
      .where('status', 'pending')
      .count('id as count')
      .first();

    const count = parseInt(reportCount?.count || 0, 10);

    if (count >= 5) {
      await this.shadowBanUser(userId, 'multiple_reports', 7);
      return { action: 'shadow_ban', reason: 'multiple_reports', duration: 7 };
    }

    if (count >= 3) {
      return { action: 'warning', reportCount: count };
    }

    return { action: 'none', reportCount: count };
  }

  static async logModerationAction(userId, action, reason, adminId) {
    console.log(`[MODERATION] User ${userId}: ${action} - ${reason || 'N/A'} by ${adminId || 'system'}`);
  }

  static getShadowBanReasons() {
    return this.SHADOW_BAN_REASONS;
  }
}

module.exports = ModerationService;
