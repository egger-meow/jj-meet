const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const knex = require('../config/database');

class AuthService {
  static generateAccessToken(userId, deviceId = null) {
    return jwt.sign(
      { 
        userId,
        deviceId,
        type: 'access'
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' }
    );
  }

  static generateRefreshToken() {
    return crypto.randomBytes(40).toString('hex');
  }

  static hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static async register(userData) {
    const { email, password, name, birth_date, user_type, gender, social_link } = userData;

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      const error = new Error('Email already registered');
      error.statusCode = 400;
      error.code = 'AUTH_EMAIL_EXISTS';
      throw error;
    }

    const user = await User.create({
      email,
      password,
      name,
      birth_date,
      user_type: user_type || 'tourist',
      gender,
      social_link
    });

    return user;
  }

  static async login(email, password, deviceInfo = {}) {
    const user = await User.findByEmail(email);
    if (!user) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      error.code = 'AUTH_INVALID_CREDENTIALS';
      throw error;
    }

    const isMatch = await User.verifyPassword(password, user.password);
    if (!isMatch) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      error.code = 'AUTH_INVALID_CREDENTIALS';
      throw error;
    }

    const { deviceId, deviceName, platform } = deviceInfo;
    const accessToken = this.generateAccessToken(user.id, deviceId);
    const refreshToken = this.generateRefreshToken();
    const familyId = crypto.randomUUID();

    if (deviceId) {
      await this.storeRefreshToken({
        userId: user.id,
        deviceId,
        deviceName,
        platform,
        refreshToken,
        familyId
      });
    }

    delete user.password;

    return {
      user,
      accessToken,
      refreshToken,
      expiresIn: 900
    };
  }

  static async storeRefreshToken({ userId, deviceId, deviceName, platform, refreshToken, familyId }) {
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await knex('refresh_tokens').insert({
      user_id: userId,
      device_id: deviceId,
      device_name: deviceName,
      platform,
      token_hash: tokenHash,
      family_id: familyId,
      status: 'active',
      expires_at: expiresAt
    });
  }

  static async refreshTokens(refreshToken, deviceId) {
    const tokenHash = this.hashToken(refreshToken);

    const storedToken = await knex('refresh_tokens')
      .where({ token_hash: tokenHash })
      .first();

    if (!storedToken) {
      const error = new Error('Invalid refresh token');
      error.statusCode = 401;
      error.code = 'AUTH_INVALID_REFRESH';
      throw error;
    }

    if (storedToken.device_id !== deviceId) {
      await this.revokeTokenFamily(storedToken.family_id, 'device_mismatch');
      const error = new Error('Token theft detected');
      error.statusCode = 401;
      error.code = 'AUTH_TOKEN_THEFT';
      throw error;
    }

    if (storedToken.status === 'used') {
      await this.revokeTokenFamily(storedToken.family_id, 'reuse_detected');
      const error = new Error('Token reuse detected');
      error.statusCode = 401;
      error.code = 'AUTH_TOKEN_REUSE';
      throw error;
    }

    if (storedToken.status === 'revoked') {
      const error = new Error('Token has been revoked');
      error.statusCode = 401;
      error.code = 'AUTH_TOKEN_REVOKED';
      throw error;
    }

    if (new Date(storedToken.expires_at) < new Date()) {
      const error = new Error('Refresh token expired');
      error.statusCode = 401;
      error.code = 'AUTH_REFRESH_EXPIRED';
      throw error;
    }

    await knex('refresh_tokens')
      .where({ id: storedToken.id })
      .update({ 
        status: 'used',
        used_at: knex.fn.now()
      });

    const newRefreshToken = this.generateRefreshToken();
    await this.storeRefreshToken({
      userId: storedToken.user_id,
      deviceId: storedToken.device_id,
      deviceName: storedToken.device_name,
      platform: storedToken.platform,
      refreshToken: newRefreshToken,
      familyId: storedToken.family_id
    });

    const accessToken = this.generateAccessToken(storedToken.user_id, deviceId);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900
    };
  }

  static async revokeTokenFamily(familyId, reason) {
    await knex('refresh_tokens')
      .where({ family_id: familyId })
      .update({
        status: 'revoked',
        revoked_at: knex.fn.now(),
        revoked_reason: reason
      });
  }

  static async logout(userId, deviceId) {
    if (deviceId) {
      await knex('refresh_tokens')
        .where({ user_id: userId, device_id: deviceId })
        .update({
          status: 'revoked',
          revoked_at: knex.fn.now(),
          revoked_reason: 'logout'
        });
    }
  }

  static async logoutAllDevices(userId, exceptDeviceId = null) {
    let query = knex('refresh_tokens')
      .where({ user_id: userId, status: 'active' });

    if (exceptDeviceId) {
      query = query.whereNot({ device_id: exceptDeviceId });
    }

    await query.update({
      status: 'revoked',
      revoked_at: knex.fn.now(),
      revoked_reason: 'logout_all'
    });
  }

  static async getDevices(userId) {
    return knex('refresh_tokens')
      .where({ user_id: userId, status: 'active' })
      .select('device_id', 'device_name', 'platform', 'created_at', 'last_used_at')
      .orderBy('last_used_at', 'desc');
  }

  static async verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }
      return decoded;
    } catch (error) {
      const err = new Error('Invalid access token');
      err.statusCode = 401;
      err.code = 'AUTH_INVALID_ACCESS';
      throw err;
    }
  }
}

module.exports = AuthService;
