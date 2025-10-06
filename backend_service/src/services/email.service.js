// backend_service/src/services/email.service.js
const nodemailer = require("nodemailer");
const logger = require("../../config/logger");
const config = require("../../config");
const {
  generatePaymentConfirmationTemplate,
  generateReturnConfirmationTemplate,
  generateFineNotificationTemplate,
  generateOverdueReminderTemplate,
} = require("../template/template");

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

  // Send overdue book reminder email
  async sendOverdueReminderEmail(user, overdueBooks, reminderType = "first") {
    try {
      const { email, full_name } = user;

      const mailOptions = {
        from: `${config.webName} Library <${config.providers.email.username}>`,
        to: email,
        subject: this.getOverdueSubject(reminderType, overdueBooks.length),
        html: generateOverdueReminderTemplate(
          full_name,
          overdueBooks,
          reminderType
        ),
      };

      await this.transporter.sendMail(mailOptions);

      await logger.info("Overdue reminder email sent successfully", {
        service: "EmailService",
        method: "sendOverdueReminderEmail",
        email: email,
        reminder_type: reminderType,
        books_count: overdueBooks.length,
      });

      return true;
    } catch (error) {
      await logger.error(error, {
        service: "EmailService",
        method: "sendOverdueReminderEmail",
        email: user.email,
      });
      throw new Error("Failed to send overdue reminder email");
    }
  }

  // Send fine notification email
  async sendFineNotificationEmail(user, fineDetails) {
    try {
      const { email, full_name } = user;

      const mailOptions = {
        from: `${config.webName} Library <${config.providers.email.username}>`,
        to: email,
        subject: `Overdue Fine Notice - $${fineDetails.totalAmount}`,
        html: generateFineNotificationTemplate(full_name, fineDetails),
      };

      await this.transporter.sendMail(mailOptions);

      await logger.info("Fine notification email sent successfully", {
        service: "EmailService",
        method: "sendFineNotificationEmail",
        email: email,
        fine_amount: fineDetails.totalAmount,
      });

      return true;
    } catch (error) {
      await logger.error(error, {
        service: "EmailService",
        method: "sendFineNotificationEmail",
        email: user.email,
      });
      throw new Error("Failed to send fine notification email");
    }
  }

  // Send book return confirmation email
  async sendReturnConfirmationEmail(user, returnDetails) {
    try {
      const { email, full_name } = user;

      const mailOptions = {
        from: `${config.webName} Library <${config.providers.email.username}>`,
        to: email,
        subject: "Book Return Confirmation",
        html: generateReturnConfirmationTemplate(full_name, returnDetails),
      };

      await this.transporter.sendMail(mailOptions);

      await logger.info("Return confirmation email sent successfully", {
        service: "EmailService",
        method: "sendReturnConfirmationEmail",
        email: email,
        transaction_id: returnDetails.transactionId,
      });

      return true;
    } catch (error) {
      await logger.error(error, {
        service: "EmailService",
        method: "sendReturnConfirmationEmail",
        email: user.email,
      });
      throw new Error("Failed to send return confirmation email");
    }
  }

  // Send payment confirmation email
  async sendPaymentConfirmationEmail(user, paymentDetails) {
    try {
      const { email, full_name } = user;

      const mailOptions = {
        from: `${config.webName} Library <${config.providers.email.username}>`,
        to: email,
        subject: "Fine Payment Confirmation",
        html: generatePaymentConfirmationTemplate(full_name, paymentDetails),
      };

      await this.transporter.sendMail(mailOptions);

      await logger.info("Payment confirmation email sent successfully", {
        service: "EmailService",
        method: "sendPaymentConfirmationEmail",
        email: email,
        payment_amount: paymentDetails.amount,
      });

      return true;
    } catch (error) {
      await logger.error(error, {
        service: "EmailService",
        method: "sendPaymentConfirmationEmail",
        email: user.email,
      });
      throw new Error("Failed to send payment confirmation email");
    }
  }

  // Generate overdue reminder subject based on reminder type
  getOverdueSubject(reminderType, bookCount) {
    const subjects = {
      first: `Reminder: ${bookCount} Book${bookCount > 1 ? "s" : ""} Overdue`,
      second: `URGENT: ${bookCount} Book${
        bookCount > 1 ? "s" : ""
      } Still Overdue`,
      final: `FINAL NOTICE: ${bookCount} Book${
        bookCount > 1 ? "s" : ""
      } Overdue - Account Suspension Imminent`,
    };

    return subjects[reminderType] || subjects.first;
  }
}

module.exports = new EmailService();
