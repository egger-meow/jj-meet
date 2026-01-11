const ModerationService = require('../services/moderation.service');

const checkBanned = async (req, res, next) => {
  try {
    if (!req.userId) {
      return next();
    }

    const isBanned = await ModerationService.isBanned(req.userId);
    
    if (isBanned) {
      return res.status(403).json({
        success: false,
        error: 'Account suspended',
        code: 'ACCOUNT_BANNED',
        message: 'Your account has been suspended. Please contact support for more information.',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

const checkShadowBanned = async (req, res, next) => {
  try {
    if (!req.userId) {
      return next();
    }

    req.isShadowBanned = await ModerationService.isShadowBanned(req.userId);
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkBanned,
  checkShadowBanned,
};
