// backend_service/src/services/user.service.js
const logger = require("../../config/logger");
const User = require("../../models/user.model");
const { ERROR_MESSAGES } = require("../constants/constants");

class UserService {
  // Get all users with filtering and pagination
  async getUsers(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10 } = pagination;
      const { search, status, role, faculty } = filters;

      let query = {};

      // Search filter
      if (search) {
        query.$or = [
          { identification_code: { $regex: search, $options: "i" } },
          { full_name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      // Status filter
      if (status) {
        query.status = status;
      }

      // Role filter
      if (role) {
        query.roles = role;
      }

      // Faculty filter
      if (faculty) {
        query.faculty = { $regex: faculty, $options: "i" };
      }

      const users = await User.find(query)
        .select("-password -password_reset_token -account_verification_otp")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await User.countDocuments(query);

      await logger.info("Users retrieved successfully", {
        service: "UserService",
        method: "getUsers",
        count: users.length,
        total,
        filters,
      });

      return {
        users,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit),
        },
      };
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
      const user = await User.findById(userId).select(
        "-password -password_reset_token -account_verification_otp"
      );

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
      }).select("-password -password_reset_token -account_verification_otp");

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

  // Update user status (block/unblock/close)
  async updateUserStatus(userId, status, reason = "") {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        {
          status,
          $push: {
            status_history: {
              status,
              reason,
              changed_at: new Date(),
            },
          },
        },
        { new: true, runValidators: true }
      ).select("-password -password_reset_token -account_verification_otp");

      if (!user) {
        throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      }

      await logger.info("User status updated", {
        service: "UserService",
        method: "updateUserStatus",
        user_id: userId,
        status,
        reason,
      });

      return user;
    } catch (error) {
      await logger.error(error, {
        service: "UserService",
        method: "updateUserStatus",
        user_id: userId,
      });
      throw error;
    }
  }

  // Delete user (soft delete)
  async deleteUser(userId) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { status: "closed" },
        { new: true }
      ).select("-password -password_reset_token -account_verification_otp");

      if (!user) {
        throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      }

      await logger.info("User deleted (soft delete)", {
        service: "UserService",
        method: "deleteUser",
        user_id: userId,
      });

      return user;
    } catch (error) {
      await logger.error(error, {
        service: "UserService",
        method: "deleteUser",
        user_id: userId,
      });
      throw error;
    }
  }

  // Permanently delete user (admin only)
  async permanentlyDeleteUser(userId) {
    try {
      const user = await User.findByIdAndDelete(userId);

      if (!user) {
        throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      }

      await logger.info("User permanently deleted", {
        service: "UserService",
        method: "permanentlyDeleteUser",
        user_id: userId,
      });

      return { message: "User permanently deleted" };
    } catch (error) {
      await logger.error(error, {
        service: "UserService",
        method: "permanentlyDeleteUser",
        user_id: userId,
      });
      throw error;
    }
  }

  // Get user statistics
  async getUserStats() {
    try {
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ status: "active" });
      const blockedUsers = await User.countDocuments({ status: "blocked" });
      const studentUsers = await User.countDocuments({ roles: "student" });
      const staffUsers = await User.countDocuments({
        roles: { $in: ["librarian", "admin"] },
      });

      const stats = {
        total_users: totalUsers,
        active_users: activeUsers,
        blocked_users: blockedUsers,
        student_users: studentUsers,
        staff_users: staffUsers,
        verified_users: await User.countDocuments({
          is_account_verified: true,
        }),
      };

      await logger.info("User statistics retrieved", {
        service: "UserService",
        method: "getUserStats",
        stats,
      });

      return stats;
    } catch (error) {
      await logger.error(error, {
        service: "UserService",
        method: "getUserStats",
      });
      throw error;
    }
  }
}

module.exports = new UserService();
