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
        from: config.providers.email.username,
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
        from: config.providers.email.username,
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
}

module.exports = new EmailService();
