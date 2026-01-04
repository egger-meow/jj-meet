const SwipeService = require('../services/swipe.service');

exports.createSwipe = async (req, res, next) => {
  try {
    const { swiped_id, direction } = req.body;
    const result = await SwipeService.createSwipe(req.userId, swiped_id, direction);
    
    res.status(201).json({ 
      success: true, 
      data: result 
    });
  } catch (error) {
    next(error);
  }
};

exports.getSwipeHistory = async (req, res, next) => {
  try {
    const options = {
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
      direction: req.query.direction
    };

    const swipes = await SwipeService.getSwipeHistory(req.userId, options);
    res.json({ success: true, data: swipes });
  } catch (error) {
    next(error);
  }
};

exports.getLikesReceived = async (req, res, next) => {
  try {
    const options = {
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
      unseenOnly: req.query.unseen === 'true'
    };

    const likes = await SwipeService.getLikesReceived(req.userId, options);
    res.json({ success: true, data: likes });
  } catch (error) {
    next(error);
  }
};

exports.undoLastSwipe = async (req, res, next) => {
  try {
    const swipe = await SwipeService.undoLastSwipe(req.userId);
    res.json({ success: true, data: swipe, message: 'Swipe undone' });
  } catch (error) {
    next(error);
  }
};
