// backend_service/src/services/auth.service.js
const logger = require("../../config/logger");
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");
const User = require("../../models/user.model");
const { ERROR_MESSAGES } = require("../constants/constants");
const config = require("../../config");

class AuthService {
  // Generate JWT token
  generateToken(id) {
    return jwt.sign({ id }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn || "7d",
    });
  }

  // Register new user
  async register(userData) {
    try {
      // Generate QR code data
      const qrData = JSON.stringify({
        matric_number: userData.matric_number.toUpperCase(),
        timestamp: new Date().toISOString(),
      });

      // Create new user
      const user = new User({
        ...userData,
        matric_number: userData.matric_number.toUpperCase(),
        email: userData.email.toLowerCase(),
        qr_code: qrData,
      });

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
        qr_code: user.qr_code,
        status: user.status,
      };

      await logger.info("User registered successfully", {
        service: "AuthService",
        method: "register",
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
        method: "register",
        matric_number: userData.matric_number,
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

      if (!user || !(await user.comparePassword(password))) {
        throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
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
        phone: user.phone,
        id_expiration: user.id_expiration,
        status: user.status,
        borrowed_books: user.borrowed_books,
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

  // Verify QR code
  async verifyQR(qrData) {
    try {
      let parsedData;
      try {
        parsedData = JSON.parse(qrData);
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
