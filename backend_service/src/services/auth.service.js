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

      // Generate QR code only for students
      if (!isStaff) {
        qrData = {
          matric_number: userData.matric_number.toUpperCase(),
          full_name: userData.full_name,
          faculty: userData.faculty,
          department: userData.department,
          id_expiration: userData.id_expiration,
          timestamp: new Date().toISOString(),
        };

        qrCodeImage = await this.generateQRCode(qrData);
      }

      // Create new user
      const user = new User({
        ...userData,
        matric_number: userData.matric_number.toUpperCase(),
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
        matric_number: user.matric_number,
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
        matric_number: user.matric_number,
        roles: user.roles,
      });

      return {
        user: userResponse,
        message: isStaff
          ? "Registration successful. Please check your email for verification OTP."
          : "Registration successful. Please check your email for verification OTP and download your ID card.",
      };
    } catch (error) {
      await logger.error(error, {
        service: "AuthService",
        method: "register",
        matric_number: userData.matric_number,
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
  async login(matric_number, password) {
    try {
      // Find user by matric number
      const user = await User.findOne({
        matric_number: matric_number.toUpperCase(),
      });

      if (!user || !(await user.isPasswordMatch(password))) {
        throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      if (user.status !== "active") {
        throw new Error(ERROR_MESSAGES.ACCOUNT_DEACTIVATED);
      }

      // Check if user is staff (librarian/admin)
      const isStaff =
        user.roles.includes("librarian") || user.roles.includes("admin");

      if (isStaff && !user.is_account_verified) {
        throw new Error("Please verify your email before logging in");
      }

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
          matric_number: user.matric_number,
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
        matric_number: user.matric_number,
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
        matric_number: user.matric_number,
      });

      return {
        user: userResponse,
        token: this.generateToken(user._id),
      };
    } catch (error) {
      await logger.error(error, {
        service: "AuthService",
        method: "login",
        matric_number: matric_number,
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

      const isStaff =
        user.roles.includes("librarian") || user.roles.includes("admin");
      if (!isStaff) {
        throw new Error("OTP verification is only for staff members");
      }

      user.last_login = new Date();
      user.account_verification_otp = undefined;
      user.account_verification_otp_expires = undefined;
      await user.save();

      // Return user data without password
      const userResponse = {
        _id: user._id,
        matric_number: user.matric_number,
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

      const user = await User.findOne({
        matric_number: parsedData.matric_number,
      });

      if (!user) {
        throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      }

      if (user.status !== "active") {
        throw new Error(ERROR_MESSAGES.ACCOUNT_DEACTIVATED);
      }

      if (!user.isIdValid()) {
        throw new Error(ERROR_MESSAGES.ID_EXPIRED);
      }

      // Return user data without password
      const userResponse = {
        _id: user._id,
        matric_number: user.matric_number,
        full_name: user.full_name,
        faculty: user.faculty,
        department: user.department,
        email: user.email,
        id_expiration: user.id_expiration,
        status: user.status,
        borrowed_books: user.borrowed_books,
      };

      await logger.info("QR code verified successfully", {
        service: "AuthService",
        method: "verifyQR",
        user_id: user._id,
        matric_number: user.matric_number,
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
}

module.exports = new AuthService();
