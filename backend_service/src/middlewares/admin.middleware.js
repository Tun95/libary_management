// backend_service/src/middlewares/admin.middleware.js
const { sendResponse } = require("../utils/utils");
const { ERROR_MESSAGES, STATUS } = require("../constants/constants");

const isAdmin = (req, res, next) => {
  try {
    // Check if user exists and has admin role in their roles array
    if (req.user && req.user.roles && req.user.roles.includes("admin")) {
      next();
    } else {
      return sendResponse(res, 403, {
        status: STATUS.FAILED,
        message: ERROR_MESSAGES.ACCESS_DENIED || "Admin access required",
      });
    }
  } catch (error) {
    console.error("Admin middleware error:", error);
    return sendResponse(res, 500, {
      status: STATUS.FAILED,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    });
  }
};

module.exports = isAdmin;
