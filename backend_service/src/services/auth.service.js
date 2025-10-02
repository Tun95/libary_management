// backend_service/src/services/auth.service.js
const logger = require("../../config/logger");
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");
const crypto = require("crypto");
const User = require("../../models/user.model");
const { ERROR_MESSAGES } = require("../constants/constants");
const config = require("../../config");
const emailService = require("./email.service");

class AuthService {
  // Generate JWT token
  generateToken(id) {
    return jwt.sign({ id }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn || "7d",
    });
  }

  // Generate QR code
  async generateQRCode(data) {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(data));
      return qrCodeDataURL;
    } catch (error) {
      await logger.error(error, {
        service: "AuthService",
        method: "generateQRCode",
      });
      throw new Error("Failed to generate QR code");
    }
  }

  // Register new user
  async register(userData) {
    try {
      // Determine user role and set required fields
      const isStaff =
        userData.roles?.includes("librarian") ||
        userData.roles?.includes("admin");

      let qrData = null;
      let qrCodeImage = null;

      // Generate QR code for ALL users (both students and staff)
      if (isStaff) {
        // Staff QR code data
        qrData = {
          type: "staff",
          staff_id: userData.identification_code.toUpperCase(),
          full_name: userData.full_name,
          roles: userData.roles,
          email: userData.email.toLowerCase(),
          timestamp: new Date().toISOString(),
          access_level: userData.roles.includes("admin")
            ? "admin"
            : "librarian",
        };
      } else {
        // Student QR code data
        qrData = {
          type: "student",
          identification_code: userData.identification_code.toUpperCase(),
          full_name: userData.full_name,
          faculty: userData.faculty,
          department: userData.department,
          email: userData.email.toLowerCase(),
          id_expiration: userData.id_expiration,
          timestamp: new Date().toISOString(),
        };
      }

      qrCodeImage = await this.generateQRCode(qrData);

      // Create new user
      const user = new User({
        ...userData,
        identification_code: userData.identification_code.toUpperCase(),
        email: userData.email.toLowerCase(),
        qr_code: qrCodeImage,
        roles: userData.roles || ["student"],
      });

      // Generate verification OTP for all users
      const verificationOtp = user.createAccountVerificationOtp();
      await user.save();

      // Send verification email
      await emailService.sendVerificationEmail(
        user.email,
        verificationOtp,
        user.full_name
      );

      // Return user data without password
      const userResponse = {
        _id: user._id,
        identification_code: user.identification_code,
        full_name: user.full_name,
        faculty: user.faculty,
        department: user.department,
        email: user.email,
        phone: user.phone,
        id_expiration: user.id_expiration,
        qr_code: user.qr_code,
        status: user.status,
        roles: user.roles,
        is_account_verified: user.is_account_verified,
      };

      await logger.info("User registered successfully", {
        service: "AuthService",
        method: "register",
        user_id: user._id,
        identification_code: user.identification_code,
        roles: user.roles,
      });

      return {
        user: userResponse,
        message:
          "Registration successful. Please check your email for verification OTP and download your ID card.",
      };
    } catch (error) {
      await logger.error(error, {
        service: "AuthService",
        method: "register",
        identification_code: userData.identification_code,
      });
      throw error;
    }
  }

  // Verify email OTP
  async verifyEmailOtp(email, otp) {
    try {
      const user = await User.findOne({
        email: email.toLowerCase(),
        account_verification_otp: otp,
        account_verification_otp_expires: { $gt: Date.now() },
      });

      if (!user) {
        throw new Error("Invalid or expired OTP");
      }

      user.is_account_verified = true;
      user.account_verification_otp = undefined;
      user.account_verification_otp_expires = undefined;
      await user.save();

      await logger.info("Email verified successfully", {
        service: "AuthService",
        method: "verifyEmailOtp",
        user_id: user._id,
        email: user.email,
      });

      return {
        user: {
          _id: user._id,
          email: user.email,
          full_name: user.full_name,
          is_account_verified: user.is_account_verified,
          roles: user.roles,
        },
        message: "Email verified successfully",
      };
    } catch (error) {
      await logger.error(error, {
        service: "AuthService",
        method: "verifyEmailOtp",
        email: email,
      });
      throw error;
    }
  }

  // Resend verification OTP
  async resendVerificationOtp(email) {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        throw new Error("User not found");
      }

      if (user.is_account_verified) {
        throw new Error("Account is already verified");
      }

      const verificationOtp = user.createAccountVerificationOtp();
      await user.save();

      await emailService.sendVerificationEmail(
        user.email,
        verificationOtp,
        user.full_name
      );

      await logger.info("Verification OTP resent", {
        service: "AuthService",
        method: "resendVerificationOtp",
        user_id: user._id,
        email: user.email,
      });

      return {
        message: "Verification OTP sent successfully",
      };
    } catch (error) {
      await logger.error(error, {
        service: "AuthService",
        method: "resendVerificationOtp",
        email: email,
      });
      throw error;
    }
  }

  // Login user
  async login(identification_code, password) {
    try {
      // Find user by identification code
      const user = await User.findOne({
        identification_code: identification_code.toUpperCase(),
      });

      if (!user || !(await user.isPasswordMatch(password))) {
        throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      // Check if account is active
      if (user.status !== "active") {
        throw new Error(`Account is ${user.status}. Please contact support.`);
      }

      // Check if user is staff (librarian/admin)
      const isStaff =
        user.roles.includes("librarian") || user.roles.includes("admin");

      // All users must verify email before login
      if (!user.is_account_verified) {
        throw new Error("Please verify your email before logging in");
      }

      // For students, check if ID is valid
      if (!isStaff && !user.isIdValid()) {
        throw new Error(ERROR_MESSAGES.ID_EXPIRED);
      }

      // For staff members, generate login OTP
      if (isStaff) {
        const loginOtp = user.createAccountVerificationOtp();
        await user.save();

        await emailService.sendLoginOtpEmail(
          user.email,
          loginOtp,
          user.full_name
        );

        await logger.info("Login OTP sent for staff member", {
          service: "AuthService",
          method: "login",
          user_id: user._id,
          identification_code: user.identification_code,
          roles: user.roles,
        });

        return {
          requires_otp: true,
          message: "OTP sent to your email for admin panel access",
          user: {
            _id: user._id,
            email: user.email,
            roles: user.roles,
          },
        };
      }

      // For students, direct login
      user.last_login = new Date();
      await user.save();

      // Return user data without password
      const userResponse = {
        _id: user._id,
        identification_code: user.identification_code,
        full_name: user.full_name,
        faculty: user.faculty,
        department: user.department,
        email: user.email,
        phone: user.phone,
        id_expiration: user.id_expiration,
        status: user.status,
        roles: user.roles,
        borrowed_books: user.borrowed_books,
        is_account_verified: user.is_account_verified,
      };

      await logger.info("User logged in successfully", {
        service: "AuthService",
        method: "login",
        user_id: user._id,
        identification_code: user.identification_code,
      });

      return {
        user: userResponse,
        token: this.generateToken(user._id),
      };
    } catch (error) {
      await logger.error(error, {
        service: "AuthService",
        method: "login",
        identification_code: identification_code,
      });
      throw error;
    }
  }

  // Verify login OTP for staff
  async verifyLoginOtp(email, otp) {
    try {
      const user = await User.findOne({
        email: email.toLowerCase(),
        account_verification_otp: otp,
        account_verification_otp_expires: { $gt: Date.now() },
      });

      if (!user) {
        throw new Error("Invalid or expired OTP");
      }

      if (user.status !== "active") {
        throw new Error(`Account is ${user.status}. Please contact support.`);
      }

      const isStaff =
        user.roles.includes("librarian") || user.roles.includes("admin");
      if (!isStaff) {
        throw new Error("OTP verification is only for staff members");
      }

      user.last_login = new Date();
      user.is_account_verified = true;
      user.account_verification_otp = undefined;
      user.account_verification_otp_expires = undefined;
      await user.save();

      // Return user data without password
      const userResponse = {
        _id: user._id,
        identification_code: user.identification_code,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        roles: user.roles,
        is_account_verified: user.is_account_verified,
      };

      await logger.info("Staff member logged in with OTP", {
        service: "AuthService",
        method: "verifyLoginOtp",
        user_id: user._id,
        email: user.email,
        roles: user.roles,
      });

      return {
        user: userResponse,
        token: this.generateToken(user._id),
      };
    } catch (error) {
      await logger.error(error, {
        service: "AuthService",
        method: "verifyLoginOtp",
        email: email,
      });
      throw error;
    }
  }

  // Verify QR code
  async verifyQR(qr_data) {
    try {
      let parsedData;
      try {
        parsedData = JSON.parse(qr_data);
      } catch (error) {
        throw new Error(ERROR_MESSAGES.QR_INVALID);
      }

      let user;

      // Handle different QR code types
      if (parsedData.type === "staff") {
        user = await User.findOne({
          identification_code: parsedData.staff_id,
        });
      } else {
        user = await User.findOne({
          identification_code: parsedData.identification_code,
        });
      }

      if (!user) {
        throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      }

      if (user.status !== "active") {
        throw new Error(`Account is ${user.status}. Library access denied.`);
      }

      // For students, check if ID is valid
      const isStaff =
        user.roles.includes("librarian") || user.roles.includes("admin");
      if (!isStaff && !user.isIdValid()) {
        throw new Error(ERROR_MESSAGES.ID_EXPIRED);
      }

      // Return user data without password
      const userResponse = {
        _id: user._id,
        identification_code: user.identification_code,
        full_name: user.full_name,
        faculty: user.faculty,
        department: user.department,
        email: user.email,
        id_expiration: user.id_expiration,
        status: user.status,
        roles: user.roles,
        borrowed_books: user.borrowed_books,
      };

      await logger.info("QR code verified successfully", {
        service: "AuthService",
        method: "verifyQR",
        user_id: user._id,
        identification_code: user.identification_code,
        user_type: isStaff ? "staff" : "student",
      });

      return userResponse;
    } catch (error) {
      await logger.error(error, {
        service: "AuthService",
        method: "verifyQR",
      });
      throw error;
    }
  }

  // Forgot Password
  async forgotPassword(email) {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        // Don't reveal if email exists or not for security
        await logger.info("Password reset requested for non-existent email", {
          service: "AuthService",
          method: "forgotPassword",
          email: email,
        });
        return { message: "If the email exists, a reset link has been sent" };
      }

      if (user.status !== "active") {
        throw new Error("Account is not active");
      }

      const resetToken = user.createPasswordResetToken();
      await user.save();

      // Send password reset email
      const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;

      await emailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        user.full_name,
        resetUrl
      );

      await logger.info("Password reset email sent", {
        service: "AuthService",
        method: "forgotPassword",
        user_id: user._id,
        email: user.email,
      });

      return {
        message: "If the email exists, a reset link has been sent",
        reset_token: resetToken, // For API testing
      };
    } catch (error) {
      await logger.error(error, {
        service: "AuthService",
        method: "forgotPassword",
        email: email,
      });
      throw error;
    }
  }

  // Reset Password
  async resetPassword(token, newPassword) {
    try {
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      const user = await User.findOne({
        password_reset_token: hashedToken,
        password_reset_expires: { $gt: Date.now() },
      });

      if (!user) {
        throw new Error("Invalid or expired reset token");
      }

      if (user.status !== "active") {
        throw new Error("Account is not active");
      }

      // Check if new password is same as old password
      if (await user.isPasswordMatch(newPassword)) {
        throw new Error("New password cannot be the same as the old password");
      }

      // Update password
      user.password = newPassword;
      user.password_reset_token = undefined;
      user.password_reset_expires = undefined;
      user.password_change_at = Date.now();
      await user.save();

      // Send password changed notification
      await emailService.sendPasswordChangedEmail(user.email, user.full_name);

      await logger.info("Password reset successfully", {
        service: "AuthService",
        method: "resetPassword",
        user_id: user._id,
        email: user.email,
      });

      return {
        message: "Password reset successfully",
        user: {
          _id: user._id,
          email: user.email,
          full_name: user.full_name,
        },
      };
    } catch (error) {
      await logger.error(error, {
        service: "AuthService",
        method: "resetPassword",
      });
      throw error;
    }
  }

  // Change Password (for authenticated users)
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error("User not found");
      }

      if (!(await user.isPasswordMatch(currentPassword))) {
        throw new Error("Current password is incorrect");
      }

      if (user.status !== "active") {
        throw new Error("Account is not active");
      }

      // Check if new password is same as old password
      if (await user.isPasswordMatch(newPassword)) {
        throw new Error("New password cannot be the same as the old password");
      }

      // Update password
      user.password = newPassword;
      user.password_change_at = Date.now();
      await user.save();

      // Send password changed notification
      await emailService.sendPasswordChangedEmail(user.email, user.full_name);

      await logger.info("Password changed successfully", {
        service: "AuthService",
        method: "changePassword",
        user_id: user._id,
        email: user.email,
      });

      return {
        message: "Password changed successfully",
        user: {
          _id: user._id,
          email: user.email,
          full_name: user.full_name,
        },
      };
    } catch (error) {
      await logger.error(error, {
        service: "AuthService",
        method: "changePassword",
        user_id: userId,
      });
      throw error;
    }
  }

  // Verify Reset Token
  async verifyResetToken(token) {
    try {
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      const user = await User.findOne({
        password_reset_token: hashedToken,
        password_reset_expires: { $gt: Date.now() },
      });

      if (!user) {
        throw new Error("Invalid or expired reset token");
      }

      return {
        valid: true,
        email: user.email,
        full_name: user.full_name,
      };
    } catch (error) {
      await logger.error(error, {
        service: "AuthService",
        method: "verifyResetToken",
      });
      throw error;
    }
  }
}

module.exports = new AuthService();
