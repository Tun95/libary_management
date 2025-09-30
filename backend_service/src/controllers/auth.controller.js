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
        message: ERROR_MESSAGES.REGISTRATION_SUCCESS,
        data: result,
      });
    } catch (error) {
      await logger.error(error, {
        controller: "AuthController",
        method: "register",
        matric_number: req.body.matric_number,
      });

      if (error.code === 11000) {
        return sendResponse(res, 409, {
          status: STATUS.FAILED,
          message: ERROR_MESSAGES.DUPLICATE_MATRIC,
        });
      }

      return sendResponse(res, 500, {
        status: STATUS.FAILED,
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // Login user
  async login(req, res) {
    try {
      const { matric_number, password } = req.body;
      const result = await authService.login(matric_number, password);

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        message: ERROR_MESSAGES.LOGIN_SUCCESS,
        data: result,
      });
    } catch (error) {
      await logger.error(error, {
        controller: "AuthController",
        method: "login",
        matric_number: req.body.matric_number,
      });

      const statusCode =
        error.message === ERROR_MESSAGES.INVALID_CREDENTIALS
          ? 401
          : error.message === ERROR_MESSAGES.ACCOUNT_DEACTIVATED
          ? 403
          : error.message === ERROR_MESSAGES.ID_EXPIRED
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
}

module.exports = new AuthController();
