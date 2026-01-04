const MatchService = require('../services/match.service');

exports.getMatches = async (req, res, next) => {
  try {
    const options = {
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
      sortBy: req.query.sortBy || 'last_interaction'
    };

    const matches = await MatchService.getMatches(req.userId, options);
    res.json({ success: true, data: matches });
  } catch (error) {
    next(error);
  }
};

exports.getMatchById = async (req, res, next) => {
  try {
    const match = await MatchService.getMatchById(req.params.matchId, req.userId);
    res.json({ success: true, data: match });
  } catch (error) {
    next(error);
  }
};

exports.unmatch = async (req, res, next) => {
  try {
    const result = await MatchService.unmatch(req.params.matchId, req.userId);
    res.json({ success: true, data: result, message: 'Unmatched successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getMatchStats = async (req, res, next) => {
  try {
    const stats = await MatchService.getMatchStats(req.userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};
