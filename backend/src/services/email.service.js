const nodemailer = require('nodemailer');
const crypto = require('crypto');
const knex = require('../config/database');

class EmailService {
  static transporter = null;

  static getTransporter() {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
    return this.transporter;
  }

  static generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  static async createVerificationToken(userId, type, expiresInHours = 24) {
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    await knex('verification_tokens')
      .where({ user_id: userId, type, is_used: false })
      .del();

    const [verificationToken] = await knex('verification_tokens')
      .insert({
        user_id: userId,
        token,
        type,
        expires_at: expiresAt,
      })
      .returning('*');

    return verificationToken;
  }

  static async verifyToken(token, type) {
    const verificationToken = await knex('verification_tokens')
      .where({ token, type, is_used: false })
      .where('expires_at', '>', knex.fn.now())
      .first();

    if (!verificationToken) {
      const error = new Error('Invalid or expired verification token');
      error.statusCode = 400;
      error.code = 'VERIFICATION_INVALID_TOKEN';
      throw error;
    }

    await knex('verification_tokens')
      .where({ id: verificationToken.id })
      .update({
        is_used: true,
        used_at: knex.fn.now(),
      });

    return verificationToken;
  }

  static async sendVerificationEmail(user) {
    const verificationToken = await this.createVerificationToken(user.id, 'email');
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken.token}`;

    const mailOptions = {
      from: `"JJ-Meet" <${process.env.SMTP_FROM || 'noreply@jjmeet.app'}>`,
      to: user.email,
      subject: 'Verify your JJ-Meet account',
      html: this.getVerificationEmailTemplate(user.name, verificationUrl),
    };

    try {
      if (process.env.NODE_ENV === 'test') {
        console.log('[EMAIL] Test mode - skipping email send');
        return { success: true, token: verificationToken.token };
      }

      await this.getTransporter().sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Email send error:', error);
      const err = new Error('Failed to send verification email');
      err.statusCode = 500;
      err.code = 'EMAIL_SEND_FAILED';
      throw err;
    }
  }

  static async verifyEmail(token) {
    const verificationToken = await this.verifyToken(token, 'email');

    const [user] = await knex('users')
      .where({ id: verificationToken.user_id })
      .update({
        email_verified: true,
      })
      .returning(['id', 'email', 'name', 'email_verified']);

    return user;
  }

  static async sendPasswordResetEmail(user) {
    const resetToken = await this.createVerificationToken(user.id, 'password_reset', 1);
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken.token}`;

    const mailOptions = {
      from: `"JJ-Meet" <${process.env.SMTP_FROM || 'noreply@jjmeet.app'}>`,
      to: user.email,
      subject: 'Reset your JJ-Meet password',
      html: this.getPasswordResetEmailTemplate(user.name, resetUrl),
    };

    try {
      if (process.env.NODE_ENV === 'test') {
        console.log('[EMAIL] Test mode - skipping email send');
        return { success: true, token: resetToken.token };
      }

      await this.getTransporter().sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Email send error:', error);
      const err = new Error('Failed to send password reset email');
      err.statusCode = 500;
      err.code = 'EMAIL_SEND_FAILED';
      throw err;
    }
  }

  static getVerificationEmailTemplate(name, verificationUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; }
          .logo { font-size: 28px; font-weight: bold; color: #FF6B6B; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 8px; }
          .button { display: inline-block; background: #FF6B6B; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
          .footer { text-align: center; padding: 20px 0; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">JJ-Meet</div>
          </div>
          <div class="content">
            <h2>Welcome, ${name}!</h2>
            <p>Thanks for signing up for JJ-Meet. Please verify your email address to complete your registration.</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" class="button">Verify Email</a>
            </p>
            <p style="font-size: 12px; color: #666;">This link will expire in 24 hours. If you didn't create an account, you can ignore this email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} JJ-Meet. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  static getPasswordResetEmailTemplate(name, resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; }
          .logo { font-size: 28px; font-weight: bold; color: #FF6B6B; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 8px; }
          .button { display: inline-block; background: #FF6B6B; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
          .footer { text-align: center; padding: 20px 0; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">JJ-Meet</div>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hi ${name}, we received a request to reset your password. Click the button below to create a new password.</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p style="font-size: 12px; color: #666;">This link will expire in 1 hour. If you didn't request a password reset, you can ignore this email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} JJ-Meet. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = EmailService;
