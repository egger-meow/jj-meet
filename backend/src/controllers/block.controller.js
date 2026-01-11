const BlockService = require('../services/block.service');
const { validationResult } = require('express-validator');

const blockUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { blockedId, reason } = req.body;
    const block = await BlockService.blockUser(req.userId, blockedId, reason);

    res.status(201).json({
      success: true,
      data: block,
      message: 'User blocked successfully',
    });
  } catch (error) {
    next(error);
  }
};

const unblockUser = async (req, res, next) => {
  try {
    const { blockedId } = req.params;
    const result = await BlockService.unblockUser(req.userId, blockedId);

    res.json({
      success: true,
      data: result,
      message: 'User unblocked successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getBlockedUsers = async (req, res, next) => {
  try {
    const blockedUsers = await BlockService.getBlockedUsers(req.userId);

    res.json({
      success: true,
      data: blockedUsers,
    });
  } catch (error) {
    next(error);
  }
};

const checkBlocked = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const isBlocked = await BlockService.isBlocked(req.userId, userId);

    res.json({
      success: true,
      data: { isBlocked },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  blockUser,
  unblockUser,
  getBlockedUsers,
  checkBlocked,
};
