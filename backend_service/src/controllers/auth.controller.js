// backend_service/src/controllers/auth.controller.js
const logger = require("../../config/logger");
const { sendResponse } = require("../utils/utils");
const { ERROR_MESSAGES, STATUS } = require("../constants/constants");
const authService = require("../services/auth.service");

class AuthController {
  // Register user
  async register(req, res) {
    try {
      const userData = req.body;
      const result = await authService.register(userData);

      return sendResponse(res, 201, {
        status: STATUS.SUCCESS,
        message: result.message,
        data: {
          user: result.user,
          otp_sent: true,
        },
      });
    } catch (error) {
      await logger.error(error, {
        controller: "AuthController",
        method: "register",
        identification_code: req.body.identification_code,
      });

      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        const message =
          field === "identification_code"
            ? ERROR_MESSAGES.DUPLICATE_IDENTIFICATION
            : field === "email"
            ? ERROR_MESSAGES.DUPLICATE_EMAIL
            : ERROR_MESSAGES.DUPLICATE_ENTRY;

        return sendResponse(res, 409, {
          status: STATUS.FAILED,
          message: message,
        });
      }

      return sendResponse(res, 500, {
        status: STATUS.FAILED,
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // Verify email OTP
  async verifyEmailOtp(req, res) {
    try {
      const { email, otp } = req.body;
      const result = await authService.verifyEmailOtp(email, otp);

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        message: result.message,
        data: result,
      });
    } catch (error) {
      await logger.error(error, {
        controller: "AuthController",
        method: "verifyEmailOtp",
        email: req.body.email,
      });

      const statusCode = error.message === "Invalid or expired OTP" ? 400 : 500;

      return sendResponse(res, statusCode, {
        status: STATUS.FAILED,
        message: error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // Resend verification OTP
  async resendVerificationOtp(req, res) {
    try {
      const { email } = req.body;
      const result = await authService.resendVerificationOtp(email);

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        message: result.message,
        data: { otp_sent: true },
      });
    } catch (error) {
      await logger.error(error, {
        controller: "AuthController",
        method: "resendVerificationOtp",
        email: req.body.email,
      });

      const statusCode =
        error.message === "User not found"
          ? 404
          : error.message === "Account is already verified"
          ? 400
          : 500;

      return sendResponse(res, statusCode, {
        status: STATUS.FAILED,
        message: error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // Login user
  async login(req, res) {
    try {
      const { identification_code, password } = req.body;
      const result = await authService.login(identification_code, password);

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        message: result.message,
        data: result,
      });
    } catch (error) {
      await logger.error(error, {
        controller: "AuthController",
        method: "login",
        identification_code: req.body.identification_code,
      });

      const statusCode =
        error.message === ERROR_MESSAGES.INVALID_CREDENTIALS
          ? 401
          : error.message === ERROR_MESSAGES.ACCOUNT_DEACTIVATED
          ? 403
          : error.message === ERROR_MESSAGES.ID_EXPIRED
          ? 403
          : error.message === "Please verify your email before logging in"
          ? 403
          : 500;

      return sendResponse(res, statusCode, {
        status: STATUS.FAILED,
        message: error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // Verify login OTP for staff
  async verifyLoginOtp(req, res) {
    try {
      const { email, otp } = req.body;
      const result = await authService.verifyLoginOtp(email, otp);

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      await logger.error(error, {
        controller: "AuthController",
        method: "verifyLoginOtp",
        email: req.body.email,
      });

      const statusCode =
        error.message === "Invalid or expired OTP"
          ? 400
          : error.message === "OTP verification is only for staff members"
          ? 403
          : 500;

      return sendResponse(res, statusCode, {
        status: STATUS.FAILED,
        message: error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // Verify QR Code
  async verifyQR(req, res) {
    try {
      const { qr_data } = req.body;
      const result = await authService.verifyQR(qr_data);

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        message: ERROR_MESSAGES.QR_VERIFICATION_SUCCESS,
        data: result,
      });
    } catch (error) {
      await logger.error(error, {
        controller: "AuthController",
        method: "verifyQR",
      });

      const statusCode =
        error.message === ERROR_MESSAGES.QR_INVALID
          ? 400
          : error.message === ERROR_MESSAGES.USER_NOT_FOUND
          ? 404
          : error.message === ERROR_MESSAGES.ID_EXPIRED
          ? 403
          : 500;

      return sendResponse(res, statusCode, {
        status: STATUS.FAILED,
        message: error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // Forgot Password
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        message: result.message,
        data: { email_sent: true },
      });
    } catch (error) {
      await logger.error(error, {
        controller: "AuthController",
        method: "forgotPassword",
        email: req.body.email,
      });

      const statusCode = error.message === "Account is not active" ? 403 : 500;

      return sendResponse(res, statusCode, {
        status: STATUS.FAILED,
        message: error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // Reset Password
  async resetPassword(req, res) {
    try {
      const { token, new_password } = req.body;
      const result = await authService.resetPassword(token, new_password);

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        message: result.message,
        data: result,
      });
    } catch (error) {
      await logger.error(error, {
        controller: "AuthController",
        method: "resetPassword",
      });

      const statusCode =
        error.message === "Invalid or expired reset token"
          ? 400
          : error.message === "Account is not active"
          ? 403
          : 500;

      return sendResponse(res, statusCode, {
        status: STATUS.FAILED,
        message: error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // Change Password
  async changePassword(req, res) {
    try {
      const { current_password, new_password } = req.body;
      const result = await authService.changePassword(
        req.user._id,
        current_password,
        new_password
      );

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        message: result.message,
        data: result,
      });
    } catch (error) {
      await logger.error(error, {
        controller: "AuthController",
        method: "changePassword",
        user_id: req.user._id,
      });

      const statusCode =
        error.message === "User not found"
          ? 404
          : error.message === "Current password is incorrect"
          ? 400
          : error.message === "Account is not active"
          ? 403
          : 500;

      return sendResponse(res, statusCode, {
        status: STATUS.FAILED,
        message: error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // Verify Reset Token
  async verifyResetToken(req, res) {
    try {
      const { token } = req.body;
      const result = await authService.verifyResetToken(token);

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        message: "Reset token is valid",
        data: result,
      });
    } catch (error) {
      await logger.error(error, {
        controller: "AuthController",
        method: "verifyResetToken",
      });

      const statusCode =
        error.message === "Invalid or expired reset token" ? 400 : 500;

      return sendResponse(res, statusCode, {
        status: STATUS.FAILED,
        message: error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  }
}

module.exports = new AuthController();
