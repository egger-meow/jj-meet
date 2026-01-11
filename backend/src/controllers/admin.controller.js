const ReportService = require('../services/report.service');
const ModerationService = require('../services/moderation.service');
const VerificationService = require('../services/verification.service');
const knex = require('../config/database');

const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeUsers,
      pendingReports,
      totalMatches,
      verifiedUsers,
    ] = await Promise.all([
      knex('users').count('id as count').first(),
      knex('users').where('is_active', true).count('id as count').first(),
      knex('reports').where('status', 'pending').count('id as count').first(),
      knex('matches').where('is_active', true).count('id as count').first(),
      knex('users').where('is_verified', true).count('id as count').first(),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers: parseInt(totalUsers?.count || 0, 10),
        activeUsers: parseInt(activeUsers?.count || 0, 10),
        pendingReports: parseInt(pendingReports?.count || 0, 10),
        totalMatches: parseInt(totalMatches?.count || 0, 10),
        verifiedUsers: parseInt(verifiedUsers?.count || 0, 10),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getReports = async (req, res, next) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let query = knex('reports')
      .join('users as reporter', 'reports.reporter_id', 'reporter.id')
      .join('users as reported', 'reports.reported_id', 'reported.id')
      .select(
        'reports.*',
        'reporter.name as reporter_name',
        'reporter.email as reporter_email',
        'reported.name as reported_name',
        'reported.email as reported_email',
        'reported.is_shadow_banned',
        'reported.is_banned'
      )
      .orderBy('reports.created_at', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    if (status) {
      query = query.where('reports.status', status);
    }

    const reports = await query;

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
};

const getReportById = async (req, res, next) => {
  try {
    const { reportId } = req.params;

    const report = await knex('reports')
      .where('reports.id', reportId)
      .join('users as reporter', 'reports.reporter_id', 'reporter.id')
      .join('users as reported', 'reports.reported_id', 'reported.id')
      .select(
        'reports.*',
        'reporter.name as reporter_name',
        'reporter.email as reporter_email',
        'reporter.profile_photo as reporter_photo',
        'reported.name as reported_name',
        'reported.email as reported_email',
        'reported.profile_photo as reported_photo',
        'reported.is_shadow_banned',
        'reported.is_banned',
        'reported.is_verified'
      )
      .first();

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found',
        code: 'REPORT_NOT_FOUND',
      });
    }

    const reportHistory = await knex('reports')
      .where('reported_id', report.reported_id)
      .orderBy('created_at', 'desc')
      .limit(10);

    res.json({
      success: true,
      data: {
        ...report,
        reportHistory,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateReport = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const { status, adminNotes, actionTaken } = req.body;

    const report = await ReportService.updateReportStatus(
      reportId,
      req.userId,
      status,
      adminNotes,
      actionTaken
    );

    if (actionTaken === 'shadow_ban') {
      await ModerationService.shadowBanUser(
        report.reported_id,
        'policy_violation',
        7,
        req.userId
      );
    } else if (actionTaken === 'permanent_ban') {
      await ModerationService.banUser(
        report.reported_id,
        'policy_violation',
        req.userId
      );
    }

    res.json({
      success: true,
      data: report,
      message: 'Report updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const { search, status, limit = 50, offset = 0 } = req.query;

    let query = knex('users')
      .select(
        'id',
        'email',
        'name',
        'profile_photo',
        'is_active',
        'is_verified',
        'is_shadow_banned',
        'is_banned',
        'created_at',
        'last_active'
      )
      .orderBy('created_at', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    if (search) {
      query = query.where(function() {
        this.where('email', 'ilike', `%${search}%`)
          .orWhere('name', 'ilike', `%${search}%`);
      });
    }

    if (status === 'banned') {
      query = query.where('is_banned', true);
    } else if (status === 'shadow_banned') {
      query = query.where('is_shadow_banned', true);
    } else if (status === 'verified') {
      query = query.where('is_verified', true);
    }

    const users = await query;

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await knex('users')
      .where('id', userId)
      .select(
        'id',
        'email',
        'name',
        'profile_photo',
        'bio',
        'is_active',
        'is_verified',
        'is_shadow_banned',
        'shadow_ban_reason',
        'is_banned',
        'ban_reason',
        'email_verified',
        'created_at',
        'last_active'
      )
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    const [reportCount, matchCount] = await Promise.all([
      knex('reports').where('reported_id', userId).count('id as count').first(),
      knex('matches')
        .where(function() {
          this.where('user1_id', userId).orWhere('user2_id', userId);
        })
        .count('id as count')
        .first(),
    ]);

    res.json({
      success: true,
      data: {
        ...user,
        reportCount: parseInt(reportCount?.count || 0, 10),
        matchCount: parseInt(matchCount?.count || 0, 10),
      },
    });
  } catch (error) {
    next(error);
  }
};

const banUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await ModerationService.banUser(userId, reason, req.userId);

    res.json({
      success: true,
      data: user,
      message: 'User banned successfully',
    });
  } catch (error) {
    next(error);
  }
};

const unbanUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await ModerationService.unbanUser(userId, req.userId);

    res.json({
      success: true,
      data: user,
      message: 'User unbanned successfully',
    });
  } catch (error) {
    next(error);
  }
};

const shadowBanUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { reason, durationDays } = req.body;

    const user = await ModerationService.shadowBanUser(
      userId,
      reason,
      durationDays,
      req.userId
    );

    res.json({
      success: true,
      data: user,
      message: 'User shadow banned successfully',
    });
  } catch (error) {
    next(error);
  }
};

const removeShadowBan = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await ModerationService.removeShadowBan(userId, req.userId);

    res.json({
      success: true,
      data: user,
      message: 'Shadow ban removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

const revokeVerification = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await VerificationService.revokeVerification(
      userId,
      reason,
      req.userId
    );

    res.json({
      success: true,
      data: user,
      message: 'Verification revoked successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getModerationLogs = async (req, res, next) => {
  try {
    const { userId, adminId, action, limit, offset } = req.query;

    const logs = await ModerationService.getModerationLogs({
      userId,
      adminId,
      action,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
    });

    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

const getUserModerationHistory = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const history = await ModerationService.getUserModerationHistory(userId);
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};

const getModerationAnalytics = async (req, res, next) => {
  try {
    const { days } = req.query;
    const analytics = await ModerationService.getAnalytics(parseInt(days) || 30);
    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getReports,
  getReportById,
  updateReport,
  getUsers,
  getUserById,
  banUser,
  unbanUser,
  shadowBanUser,
  removeShadowBan,
  revokeVerification,
  getModerationLogs,
  getUserModerationHistory,
  getModerationAnalytics,
};
