const EmailService = require('../services/email.service');
const VerificationService = require('../services/verification.service');
const { validationResult } = require('express-validator');
const knex = require('../config/database');

const sendVerificationEmail = async (req, res, next) => {
  try {
    const user = await knex('users')
      .where({ id: req.userId })
      .select('id', 'email', 'name', 'email_verified')
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        error: 'Email already verified',
        code: 'EMAIL_ALREADY_VERIFIED',
      });
    }

    await EmailService.sendVerificationEmail(user);

    res.json({
      success: true,
      message: 'Verification email sent',
    });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { token } = req.body;
    const user = await EmailService.verifyEmail(token);

    res.json({
      success: true,
      data: user,
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

const requestPasswordReset = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email } = req.body;
    const user = await knex('users')
      .where({ email })
      .select('id', 'email', 'name')
      .first();

    if (user) {
      await EmailService.sendPasswordResetEmail(user);
    }

    res.json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent',
    });
  } catch (error) {
    next(error);
  }
};

const getVerificationStatus = async (req, res, next) => {
  try {
    const user = await knex('users')
      .where({ id: req.userId })
      .select('email_verified', 'is_verified')
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    res.json({
      success: true,
      data: {
        email_verified: !!user.email_verified,
        selfie_verified: !!user.is_verified,
      },
    });
  } catch (error) {
    next(error);
  }
};

const verifySelfie = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Selfie image is required',
        code: 'VERIFICATION_NO_IMAGE',
      });
    }

    const result = await VerificationService.verifySelfie(
      req.userId,
      req.file.buffer,
      req.file.mimetype
    );

    res.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendVerificationEmail,
  verifyEmail,
  requestPasswordReset,
  getVerificationStatus,
  verifySelfie,
};
