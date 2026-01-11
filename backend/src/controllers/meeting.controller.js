const MeetingService = require('../services/meeting.service');
const { validationResult } = require('express-validator');

exports.suggestLocations = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const { lat, lng, radius, category, limit } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    const locations = await MeetingService.suggestLocations(matchId, req.userId, {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radius: radius ? parseFloat(radius) : 5,
      category,
      limit: limit ? parseInt(limit) : 10,
    });

    res.json({ success: true, data: locations });
  } catch (error) {
    next(error);
  }
};

exports.createProposal = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { matchId } = req.params;
    const proposal = await MeetingService.createProposal(req.userId, matchId, req.body);

    res.status(201).json({
      success: true,
      data: proposal,
      message: 'Meeting proposal sent',
    });
  } catch (error) {
    next(error);
  }
};

exports.respondToProposal = async (req, res, next) => {
  try {
    const { proposalId } = req.params;
    const { response } = req.body;

    if (!['accepted', 'declined'].includes(response)) {
      return res.status(400).json({
        success: false,
        message: 'Response must be "accepted" or "declined"',
      });
    }

    const proposal = await MeetingService.respondToProposal(proposalId, req.userId, response);

    res.json({
      success: true,
      data: proposal,
      message: `Meeting proposal ${response}`,
    });
  } catch (error) {
    next(error);
  }
};

exports.getProposalsForMatch = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const proposals = await MeetingService.getProposalsForMatch(matchId, req.userId);

    res.json({ success: true, data: proposals });
  } catch (error) {
    next(error);
  }
};

exports.getMeetingHistory = async (req, res, next) => {
  try {
    const { limit, offset } = req.query;

    const history = await MeetingService.getMeetingHistory(req.userId, {
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
    });

    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};
