const knex = require('../config/database');

class ReportService {
  static REPORT_REASONS = [
    'inappropriate_content',
    'harassment',
    'spam',
    'fake_profile',
    'scam',
    'dangerous_behavior',
    'underage',
    'other',
  ];

  static REPORT_STATUSES = {
    PENDING: 'pending',
    REVIEWING: 'reviewing',
    RESOLVED: 'resolved',
    DISMISSED: 'dismissed',
  };

  static async createReport(reporterId, reportedId, reason, description = null) {
    if (reporterId === reportedId) {
      const error = new Error('Cannot report yourself');
      error.statusCode = 400;
      error.code = 'REPORT_SELF';
      throw error;
    }

    if (!this.REPORT_REASONS.includes(reason)) {
      const error = new Error('Invalid report reason');
      error.statusCode = 400;
      error.code = 'REPORT_INVALID_REASON';
      throw error;
    }

    const existingReport = await knex('reports')
      .where({ reporter_id: reporterId, reported_id: reportedId, status: 'pending' })
      .first();

    if (existingReport) {
      const error = new Error('You already have a pending report for this user');
      error.statusCode = 400;
      error.code = 'REPORT_ALREADY_PENDING';
      throw error;
    }

    const [report] = await knex('reports')
      .insert({
        reporter_id: reporterId,
        reported_id: reportedId,
        reason,
        description,
        status: 'pending',
      })
      .returning('*');

    return report;
  }

  static async getReportById(reportId) {
    const report = await knex('reports')
      .where({ id: reportId })
      .first();

    if (!report) {
      const error = new Error('Report not found');
      error.statusCode = 404;
      error.code = 'REPORT_NOT_FOUND';
      throw error;
    }

    return report;
  }

  static async getUserReports(userId) {
    return knex('reports')
      .where('reporter_id', userId)
      .orderBy('created_at', 'desc');
  }

  static async getReportsAgainstUser(userId) {
    return knex('reports')
      .where('reported_id', userId)
      .orderBy('created_at', 'desc');
  }

  static async getPendingReports(options = {}) {
    const { limit = 50, offset = 0 } = options;

    return knex('reports')
      .join('users as reporter', 'reports.reporter_id', 'reporter.id')
      .join('users as reported', 'reports.reported_id', 'reported.id')
      .where('reports.status', 'pending')
      .select(
        'reports.*',
        'reporter.name as reporter_name',
        'reporter.email as reporter_email',
        'reported.name as reported_name',
        'reported.email as reported_email'
      )
      .orderBy('reports.created_at', 'asc')
      .limit(limit)
      .offset(offset);
  }

  static async updateReportStatus(reportId, reviewerId, status, adminNotes = null, actionTaken = null) {
    if (!Object.values(this.REPORT_STATUSES).includes(status)) {
      const error = new Error('Invalid report status');
      error.statusCode = 400;
      error.code = 'REPORT_INVALID_STATUS';
      throw error;
    }

    const [report] = await knex('reports')
      .where({ id: reportId })
      .update({
        status,
        reviewed_by: reviewerId,
        admin_notes: adminNotes,
        action_taken: actionTaken,
        reviewed_at: knex.fn.now(),
      })
      .returning('*');

    if (!report) {
      const error = new Error('Report not found');
      error.statusCode = 404;
      error.code = 'REPORT_NOT_FOUND';
      throw error;
    }

    return report;
  }

  static async getReportCount(reportedId) {
    const result = await knex('reports')
      .where('reported_id', reportedId)
      .count('id as count')
      .first();

    return parseInt(result?.count || 0, 10);
  }

  static async getReportCountByStatus(reportedId) {
    const counts = await knex('reports')
      .where('reported_id', reportedId)
      .groupBy('status')
      .select('status')
      .count('id as count');

    return counts.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count, 10);
      return acc;
    }, {});
  }

  static getReportReasons() {
    return this.REPORT_REASONS;
  }
}

module.exports = ReportService;
