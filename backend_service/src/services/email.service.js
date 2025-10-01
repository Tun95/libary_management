// backend_service/src/services/email.service.js
const nodemailer = require("nodemailer");
const logger = require("../../config/logger");
const config = require("../../config");

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: config.providers.email.service,
      host: config.providers.email.host,
      port: config.providers.email.port,
      secure: config.providers.email.secure,
      auth: {
        user: config.providers.email.username,
        pass: config.providers.email.password,
      },
    });
  }

  async sendVerificationEmail(email, otp, full_name) {
    try {
      const mailOptions = {
        from: `${config.webName} <${config.providers.email.username}>`,
        to: email,
        subject: "Verify Your Library Account",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to ${config.webName}!</h2>
            <p>Dear ${full_name},</p>
            <p>Thank you for registering with our library system. Please use the following OTP to verify your account:</p>
            <div style="background: #f4f4f4; padding: 15px; text-align: center; margin: 20px 0;">
              <h1 style="margin: 0; color: #333; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p>This OTP will expire in 10 minutes.</p>
            <p>If you didn't create an account, please ignore this email.</p>
            <br>
            <p>Best regards,<br>${config.webName} Team</p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      await logger.info("Verification email sent successfully", {
        service: "EmailService",
        method: "sendVerificationEmail",
        email: email,
      });

      return true;
    } catch (error) {
      await logger.error(error, {
        service: "EmailService",
        method: "sendVerificationEmail",
        email: email,
      });
      throw new Error("Failed to send verification email");
    }
  }

  async sendLoginOtpEmail(email, otp, full_name) {
    try {
      const mailOptions = {
        from: `${config.webName} <${config.providers.email.username}>`,
        to: email,
        subject: "Admin Panel Login OTP",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Admin Panel Login</h2>
            <p>Dear ${full_name},</p>
            <p>Use the following OTP to access the admin panel:</p>
            <div style="background: #f4f4f4; padding: 15px; text-align: center; margin: 20px 0;">
              <h1 style="margin: 0; color: #333; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p>This OTP will expire in 10 minutes.</p>
            <p>If you didn't request this OTP, please secure your account.</p>
            <br>
            <p>Best regards,<br>${config.webName} Team</p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      await logger.info("Login OTP email sent successfully", {
        service: "EmailService",
        method: "sendLoginOtpEmail",
        email: email,
      });

      return true;
    } catch (error) {
      await logger.error(error, {
        service: "EmailService",
        method: "sendLoginOtpEmail",
        email: email,
      });
      throw new Error("Failed to send login OTP email");
    }
  }

  async sendPasswordResetEmail(email, resetToken, full_name, resetUrl) {
    try {
      const mailOptions = {
        from: `${config.webName} <${config.providers.email.username}>`,
        to: email,
        subject: "Password Reset Request",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Dear ${full_name},</p>
            <p>You have requested to reset your password for your ${config.webName} account.</p>
            <p>Use the following token to reset your password:</p>
            <div style="background: #f4f4f4; padding: 15px; text-align: center; margin: 20px 0;">
              <h3 style="margin: 0; color: #333; word-break: break-all;">${resetToken}</h3>
            </div>
            <p>Or click the link below to reset your password:</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${resetUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>This reset token will expire in 10 minutes.</p>
            <p>If you didn't request a password reset, please ignore this email and ensure your account is secure.</p>
            <br>
            <p>Best regards,<br>${config.webName} Team</p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      await logger.info("Password reset email sent successfully", {
        service: "EmailService",
        method: "sendPasswordResetEmail",
        email: email,
      });

      return true;
    } catch (error) {
      await logger.error(error, {
        service: "EmailService",
        method: "sendPasswordResetEmail",
        email: email,
      });
      throw new Error("Failed to send password reset email");
    }
  }

  async sendPasswordChangedEmail(email, full_name) {
    try {
      const mailOptions = {
        from: `${config.webName} <${config.providers.email.username}>`,
        to: email,
        subject: "Password Changed Successfully",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Changed Successfully</h2>
            <p>Dear ${full_name},</p>
            <p>Your password for ${config.webName} has been successfully changed.</p>
            <p>If you did not make this change, please contact our support team immediately.</p>
            <br>
            <p>Best regards,<br>${config.webName} Team</p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      await logger.info("Password changed notification sent", {
        service: "EmailService",
        method: "sendPasswordChangedEmail",
        email: email,
      });

      return true;
    } catch (error) {
      await logger.error(error, {
        service: "EmailService",
        method: "sendPasswordChangedEmail",
        email: email,
      });
      return false; // Non-critical, so just log the error
    }
  }
}

module.exports = new EmailService();
