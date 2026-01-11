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

  static async logModerationAction(targetUserId, action, reason, adminId, metadata = {}) {
    await knex('moderation_logs').insert({
      admin_id: adminId,
      target_user_id: targetUserId,
      action,
      reason,
      metadata: JSON.stringify(metadata),
    });
    console.log(`[MODERATION] User ${targetUserId}: ${action} - ${reason || 'N/A'} by ${adminId || 'system'}`);
  }

  static async getModerationLogs(options = {}) {
    const { userId, adminId, action, limit = 50, offset = 0 } = options;

    let query = knex('moderation_logs')
      .leftJoin('users as admin', 'moderation_logs.admin_id', 'admin.id')
      .leftJoin('users as target', 'moderation_logs.target_user_id', 'target.id')
      .select(
        'moderation_logs.*',
        'admin.name as admin_name',
        'admin.email as admin_email',
        'target.name as target_name',
        'target.email as target_email'
      )
      .orderBy('moderation_logs.created_at', 'desc');

    if (userId) query = query.where('moderation_logs.target_user_id', userId);
    if (adminId) query = query.where('moderation_logs.admin_id', adminId);
    if (action) query = query.where('moderation_logs.action', action);

    return query.limit(limit).offset(offset);
  }

  static async getUserModerationHistory(userId) {
    const logs = await knex('moderation_logs')
      .where({ target_user_id: userId })
      .orderBy('created_at', 'desc');

    const reports = await knex('reports')
      .where({ reported_id: userId })
      .select('id', 'reason', 'status', 'created_at')
      .orderBy('created_at', 'desc');

    return { logs, reports };
  }

  static async getAnalytics(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const actionCounts = await knex('moderation_logs')
      .where('created_at', '>=', startDate)
      .groupBy('action')
      .select('action')
      .count('* as count');

    const reportsByStatus = await knex('reports')
      .where('created_at', '>=', startDate)
      .groupBy('status')
      .select('status')
      .count('* as count');

    const reportsByReason = await knex('reports')
      .where('created_at', '>=', startDate)
      .groupBy('reason')
      .select('reason')
      .count('* as count');

    const dailyActions = await knex('moderation_logs')
      .where('created_at', '>=', startDate)
      .select(knex.raw("DATE(created_at) as date"))
      .count('* as count')
      .groupBy(knex.raw("DATE(created_at)"))
      .orderBy('date', 'asc');

    const bannedUsers = await knex('users')
      .where('is_banned', true)
      .count('* as count')
      .first();

    const shadowBannedUsers = await knex('users')
      .where('is_shadow_banned', true)
      .count('* as count')
      .first();

    return {
      period_days: days,
      action_counts: actionCounts,
      reports_by_status: reportsByStatus,
      reports_by_reason: reportsByReason,
      daily_actions: dailyActions,
      current_banned: parseInt(bannedUsers.count) || 0,
      current_shadow_banned: parseInt(shadowBannedUsers.count) || 0,
    };
  }

  static getShadowBanReasons() {
    return this.SHADOW_BAN_REASONS;
  }
}

module.exports = ModerationService;
