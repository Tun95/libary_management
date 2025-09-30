// backend_service/src/controllers/user.controller.js
const logger = require("../../config/logger");
const { sendResponse } = require("../utils/utils");
const { ERROR_MESSAGES, STATUS } = require("../constants/constants");
const userService = require("../services/user.service");

class UserController {
  // Get all users
  async getUsers(req, res) {
    try {
      const users = await userService.getUsers();

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        data: users,
      });
    } catch (error) {
      logger.error(error, {
        controller: "UserController",
        method: "getUsers",
      });

      return sendResponse(res, 500, {
        status: STATUS.FAILED,
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // Get user by ID
  async getUser(req, res) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);

      // Users can only access their own data unless they're admin
      if (
        req.user._id.toString() !== user._id.toString() &&
        !req.user.isAdmin
      ) {
        return sendResponse(res, 403, {
          status: STATUS.FAILED,
          message: ERROR_MESSAGES.ACCESS_DENIED,
        });
      }

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        data: user,
      });
    } catch (error) {
      logger.error(error, {
        controller: "UserController",
        method: "getUser",
        userId: req.params.id,
      });

      if (error.message === ERROR_MESSAGES.USER_NOT_FOUND) {
        return sendResponse(res, 404, {
          status: STATUS.FAILED,
          message: ERROR_MESSAGES.USER_NOT_FOUND,
        });
      }

      return sendResponse(res, 500, {
        status: STATUS.FAILED,
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // Update user
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Users can only update their own data unless they're admin
      if (req.user._id.toString() !== id && !req.user.isAdmin) {
        return sendResponse(res, 403, {
          status: STATUS.FAILED,
          message: ERROR_MESSAGES.ACCESS_DENIED,
        });
      }

      // Prevent updating sensitive fields unless admin
      if (!req.user.isAdmin) {
        delete updateData.matricNumber;
        delete updateData.isActive;
        delete updateData.fines;
        delete updateData.borrowedBooks;
        delete updateData.isAdmin;
      }

      const user = await userService.updateUser(id, updateData);

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        message: ERROR_MESSAGES.USER_UPDATE_SUCCESS,
        data: user,
      });
    } catch (error) {
      logger.error(error, {
        controller: "UserController",
        method: "updateUser",
        userId: req.params.id,
      });

      if (error.message === ERROR_MESSAGES.USER_NOT_FOUND) {
        return sendResponse(res, 404, {
          status: STATUS.FAILED,
          message: ERROR_MESSAGES.USER_NOT_FOUND,
        });
      }

      return sendResponse(res, 500, {
        status: STATUS.FAILED,
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  }
}

module.exports = new UserController();
