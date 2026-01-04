const { validationResult } = require('express-validator');
const AuthService = require('../services/auth.service');
const UserService = require('../services/user.service');

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await AuthService.register(req.body);
    const { accessToken, refreshToken } = await AuthService.login(
      req.body.email,
      req.body.password,
      req.body.deviceInfo || {}
    );

    res.status(201).json({
      success: true,
      data: { user, accessToken, refreshToken, expiresIn: 900 }
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, deviceId, deviceName, platform } = req.body;
    const result = await AuthService.login(email, password, { deviceId, deviceName, platform });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken, deviceId } = req.body;
    const result = await AuthService.refreshTokens(refreshToken, deviceId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const { deviceId } = req.body;
    await AuthService.logout(req.userId, deviceId);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

exports.logoutAll = async (req, res, next) => {
  try {
    const { deviceId } = req.body;
    await AuthService.logoutAllDevices(req.userId, deviceId);
    res.json({ success: true, message: 'Logged out from all devices' });
  } catch (error) {
    next(error);
  }
};

exports.getDevices = async (req, res, next) => {
  try {
    const devices = await AuthService.getDevices(req.userId);
    res.json({ success: true, data: devices });
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await UserService.findById(req.userId);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const user = await UserService.updateProfile(req.userId, req.body);
    res.json({ success: true, data: user, message: 'Profile updated successfully' });
  } catch (error) {
    next(error);
  }
};
