const EmergencyService = require('../services/emergency.service');
const { validationResult } = require('express-validator');

exports.getContacts = async (req, res, next) => {
  try {
    const contacts = await EmergencyService.getContacts(req.userId);
    res.json({ success: true, data: contacts });
  } catch (error) {
    next(error);
  }
};

exports.addContact = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const contact = await EmergencyService.addContact(req.userId, req.body);
    res.status(201).json({
      success: true,
      data: contact,
      message: 'Emergency contact added',
    });
  } catch (error) {
    next(error);
  }
};

exports.updateContact = async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const contact = await EmergencyService.updateContact(contactId, req.userId, req.body);
    res.json({
      success: true,
      data: contact,
      message: 'Emergency contact updated',
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteContact = async (req, res, next) => {
  try {
    const { contactId } = req.params;
    await EmergencyService.deleteContact(contactId, req.userId);
    res.json({ success: true, message: 'Emergency contact deleted' });
  } catch (error) {
    next(error);
  }
};

exports.shareMeeting = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const result = await EmergencyService.shareMeeting(req.userId, req.body);
    res.json({
      success: true,
      data: result,
      message: 'Meeting details shared with emergency contacts',
    });
  } catch (error) {
    next(error);
  }
};

exports.checkIn = async (req, res, next) => {
  try {
    const { shareId } = req.params;
    const share = await EmergencyService.checkIn(shareId, req.userId);
    res.json({
      success: true,
      data: share,
      message: 'Checked in successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.getActiveShares = async (req, res, next) => {
  try {
    const shares = await EmergencyService.getActiveShares(req.userId);
    res.json({ success: true, data: shares });
  } catch (error) {
    next(error);
  }
};

exports.sendSOS = async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    const result = await EmergencyService.sendSOS(req.userId, { lat, lng });
    res.json({
      success: true,
      data: result,
      message: 'Emergency alert sent to all contacts',
    });
  } catch (error) {
    next(error);
  }
};
