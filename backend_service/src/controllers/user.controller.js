// backend_service/src/controllers/user.controller.js
const logger = require("../../config/logger");
const { sendResponse } = require("../utils/utils");
const { ERROR_MESSAGES, STATUS } = require("../constants/constants");
const userService = require("../services/user.service");

class UserController {
  // Get all users (admin only)
  async getUsers(req, res) {
    try {
      const { page, limit, search, status, role, faculty } = req.query;
      const result = await userService.getUsers(
        { search, status, role, faculty },
        { page, limit }
      );

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        data: result.users,
        pagination: result.pagination,
      });
    } catch (error) {
      await logger.error(error, {
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
      const isAdmin = req.user.roles.includes("admin");
      const isOwnProfile = req.user._id.toString() === user._id.toString();

      if (!isOwnProfile && !isAdmin) {
        return sendResponse(res, 403, {
          status: STATUS.FAILED,
          message: ERROR_MESSAGES.ACCESS_DENIED,
        });
      }

      // Remove sensitive fields for non-admin users
      let userResponse = user.toObject();
      if (!isAdmin) {
        delete userResponse.status_history;
        delete userResponse.fines;
        delete userResponse.roles;
        delete userResponse.last_login;
        delete userResponse.password_change_at;
      }

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        data: userResponse,
      });
    } catch (error) {
      await logger.error(error, {
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
      const isAdmin = req.user.roles.includes("admin");
      const isOwnProfile = req.user._id.toString() === id;

      if (!isOwnProfile && !isAdmin) {
        return sendResponse(res, 403, {
          status: STATUS.FAILED,
          message: ERROR_MESSAGES.ACCESS_DENIED,
        });
      }

      // Prevent updating sensitive fields unless admin
      if (!isAdmin) {
        const allowedFields = ["full_name", "phone", "profile_image"];
        Object.keys(updateData).forEach((key) => {
          if (!allowedFields.includes(key)) {
            delete updateData[key];
          }
        });
      }

      const user = await userService.updateUser(id, updateData);

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        message: ERROR_MESSAGES.USER_UPDATE_SUCCESS,
        data: user,
      });
    } catch (error) {
      await logger.error(error, {
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

  // Update user status (block/unblock/close)
  async updateUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      if (!["active", "blocked", "closed"].includes(status)) {
        return sendResponse(res, 400, {
          status: STATUS.FAILED,
          message: "Invalid status. Must be: active, blocked, or closed",
        });
      }

      const user = await userService.updateUserStatus(id, status, reason);

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        message: `User ${status} successfully`,
        data: user,
      });
    } catch (error) {
      await logger.error(error, {
        controller: "UserController",
        method: "updateUserStatus",
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

  // Delete user (soft delete)
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const user = await userService.deleteUser(id);

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        message: "User deleted successfully",
        data: user,
      });
    } catch (error) {
      await logger.error(error, {
        controller: "UserController",
        method: "deleteUser",
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

  // Permanently delete user (admin only)
  async permanentlyDeleteUser(req, res) {
    try {
      const { id } = req.params;
      const result = await userService.permanentlyDeleteUser(id);

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        message: result.message,
      });
    } catch (error) {
      await logger.error(error, {
        controller: "UserController",
        method: "permanentlyDeleteUser",
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

  // Get user statistics (admin only)
  async getUserStats(req, res) {
    try {
      const stats = await userService.getUserStats();

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        data: stats,
      });
    } catch (error) {
      await logger.error(error, {
        controller: "UserController",
        method: "getUserStats",
      });

      return sendResponse(res, 500, {
        status: STATUS.FAILED,
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // Get current user profile
  async getCurrentUser(req, res) {
    try {
      const user = await userService.getUserById(req.user._id);

      // Remove sensitive fields
      const userResponse = user.toObject();
      delete userResponse.password_reset_token;
      delete userResponse.account_verification_otp;

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        data: userResponse,
      });
    } catch (error) {
      await logger.error(error, {
        controller: "UserController",
        method: "getCurrentUser",
        userId: req.user._id,
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
