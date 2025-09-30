// backend_service/src/services/user.service.js
const logger = require("../../config/logger");
const User = require("../../models/user.model");
const { ERROR_MESSAGES } = require("../constants/constants");

class UserService {
  // Get all users
  async getUsers() {
    try {
      const users = await User.find().select("-password");

      await logger.info("Users retrieved successfully", {
        service: "UserService",
        method: "getUsers",
        count: users.length,
      });

      return users;
    } catch (error) {
      await logger.error(error, {
        service: "UserService",
        method: "getUsers",
      });
      throw error;
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const user = await User.findById(userId).select("-password");

      if (!user) {
        throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      }

      await logger.info("User retrieved by ID", {
        service: "UserService",
        method: "getUserById",
        user_id: userId,
      });

      return user;
    } catch (error) {
      await logger.error(error, {
        service: "UserService",
        method: "getUserById",
        user_id: userId,
      });
      throw error;
    }
  }

  // Update user
  async updateUser(userId, updateData) {
    try {
      const user = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
      }).select("-password");

      if (!user) {
        throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      }

      await logger.info("User updated successfully", {
        service: "UserService",
        method: "updateUser",
        user_id: userId,
      });

      return user;
    } catch (error) {
      await logger.error(error, {
        service: "UserService",
        method: "updateUser",
        user_id: userId,
      });
      throw error;
    }
  }
}

module.exports = new UserService();
