const MessageService = require('../services/message.service');

exports.getMessages = async (req, res, next) => {
  try {
    const options = {
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
      before: req.query.before,
      after: req.query.after
    };

    const messages = await MessageService.getMessages(req.params.matchId, req.userId, options);
    res.json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { content, attachment_url, attachment_type } = req.body;
    const message = await MessageService.sendMessage(
      req.params.matchId,
      req.userId,
      { content, attachment_url, attachment_type }
    );
    
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    await MessageService.markMessagesAsRead(req.params.matchId, req.userId);
    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    next(error);
  }
};

exports.deleteMessage = async (req, res, next) => {
  try {
    const result = await MessageService.deleteMessage(req.params.messageId, req.userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await MessageService.getUnreadCount(req.userId);
    res.json({ success: true, data: { unreadCount: count } });
  } catch (error) {
    next(error);
  }
};

exports.searchMessages = async (req, res, next) => {
  try {
    const { q, matchId } = req.query;
    const messages = await MessageService.searchMessages(req.userId, q, {
      limit: parseInt(req.query.limit) || 20,
      matchId
    });
    res.json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};
