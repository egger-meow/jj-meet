const ReportService = require('../services/report.service');
const { validationResult } = require('express-validator');

const createReport = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { reportedId, reason, description } = req.body;
    const report = await ReportService.createReport(
      req.userId,
      reportedId,
      reason,
      description
    );

    res.status(201).json({
      success: true,
      data: report,
      message: 'Report submitted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getMyReports = async (req, res, next) => {
  try {
    const reports = await ReportService.getUserReports(req.userId);

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
};

const getReportReasons = async (req, res, next) => {
  try {
    const reasons = ReportService.getReportReasons();

    res.json({
      success: true,
      data: reasons,
    });
  } catch (error) {
    next(error);
  }
};

const getPendingReports = async (req, res, next) => {
  try {
    const { limit, offset } = req.query;
    const reports = await ReportService.getPendingReports({
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
    });

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
};

const updateReportStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { reportId } = req.params;
    const { status, adminNotes, actionTaken } = req.body;

    const report = await ReportService.updateReportStatus(
      reportId,
      req.userId,
      status,
      adminNotes,
      actionTaken
    );

    res.json({
      success: true,
      data: report,
      message: 'Report updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReport,
  getMyReports,
  getReportReasons,
  getPendingReports,
  updateReportStatus,
};
