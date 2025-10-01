// backend_service/src/utils/validators.js
const { body, param, query, validationResult } = require("express-validator");
const User = require("../../models/user.model");
const Book = require("../../models/book.model");
const { STATUS, ERROR_MESSAGES } = require("../constants/constants");

// Check User Status Middleware
const checkUserStatus = (options = {}) => {
  const {
    checkVerified = true,
    allowedStatuses = ["active"],
    checkBlocked = true,
  } = options;

  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return sendResponse(res, 401, {
          status: STATUS.FAILED,
          message: ERROR_MESSAGES.TOKEN_INVALID,
        });
      }

      // Check if account is blocked/closed
      if (checkBlocked && !allowedStatuses.includes(user.status)) {
        return sendResponse(res, 403, {
          status: STATUS.FAILED,
          message: `Account is ${user.status}. Please contact support.`,
        });
      }

      // Check if account is verified
      if (checkVerified && !user.is_account_verified) {
        return sendResponse(res, 403, {
          status: STATUS.FAILED,
          message: "Please verify your account to access this resource",
        });
      }

      next();
    } catch (error) {
      console.error("User status check error:", error);
      return sendResponse(res, 500, {
        status: STATUS.FAILED,
        message: "Error checking user status",
      });
    }
  };
};

// Specific middleware variations for common use cases
const requireActiveUser = checkUserStatus(); // Default: active + verified
const requireActiveOnly = checkUserStatus({ checkVerified: false }); // Active but not necessarily verified
const requireVerifiedOnly = checkUserStatus({ checkBlocked: false }); // Verified but status can be anything

// Common validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: STATUS.FAILED,
      message: ERROR_MESSAGES.VALIDATION_ERROR,
      errors: errors.array(),
    });
  }
  next();
};

// Registration Validation
const registrationValidation = [
  body("matric_number")
    .isString()
    .withMessage("Matric number must be a string")
    .trim()
    .notEmpty()
    .withMessage("Matric number is required")
    .custom(async (value, { req }) => {
      const existingUser = await User.findOne({
        matric_number: value.toUpperCase(),
      });
      if (existingUser) {
        throw new Error("Matric number already exists");
      }
      return true;
    }),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&+])[A-Za-z\d@$!%*?&+]/
    )
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&+)"
    ),

  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail()
    .custom(async (value) => {
      const existingUser = await User.findOne({ email: value.toLowerCase() });
      if (existingUser) {
        throw new Error("Email already exists");
      }
      return true;
    }),

  body("full_name")
    .isString()
    .withMessage("Full name must be a string")
    .trim()
    .notEmpty()
    .withMessage("Full name is required"),

  body("roles")
    .isArray()
    .withMessage("Roles must be an array")
    .custom((value) => {
      const validRoles = ["student", "librarian", "admin"];
      for (const role of value) {
        if (!validRoles.includes(role)) {
          throw new Error(`Invalid role: ${role}`);
        }
      }
      return true;
    }),

  // Conditional validation based on roles
  body("faculty")
    .if(
      body("roles").custom(
        (roles) => !roles.includes("librarian") && !roles.includes("admin")
      )
    )
    .isString()
    .withMessage("Faculty must be a string")
    .trim()
    .notEmpty()
    .withMessage("Faculty is required for students"),

  body("department")
    .if(
      body("roles").custom(
        (roles) => !roles.includes("librarian") && !roles.includes("admin")
      )
    )
    .isString()
    .withMessage("Department must be a string")
    .trim()
    .notEmpty()
    .withMessage("Department is required for students"),

  body("id_expiration")
    .if(
      body("roles").custom(
        (roles) => !roles.includes("librarian") && !roles.includes("admin")
      )
    )
    .isISO8601()
    .withMessage("Valid expiration date is required")
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("Expiration date must be in the future");
      }
      return true;
    }),

  handleValidationErrors,
];

// Login Validation
const loginValidation = [
  body("matric_number")
    .isString()
    .withMessage("Matric number must be a string")
    .trim()
    .notEmpty()
    .withMessage("Matric number is required"),

  body("password")
    .isString()
    .withMessage("Password must be a string")
    .notEmpty()
    .withMessage("Password is required"),

  handleValidationErrors,
];

// Verify Email OTP Validation
const verifyEmailOtpValidation = [
  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),

  body("otp")
    .isString()
    .withMessage("OTP must be a string")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits"),

  handleValidationErrors,
];

// Resend OTP Validation
const resendOtpValidation = [
  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),

  handleValidationErrors,
];

// Verify Login OTP Validation
const verifyLoginOtpValidation = [
  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),

  body("otp")
    .isString()
    .withMessage("OTP must be a string")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits"),

  handleValidationErrors,
];

// QR Validation
const qrValidation = [
  body("qr_data")
    .isString()
    .withMessage("QR data must be a string")
    .notEmpty()
    .withMessage("QR data is required"),

  handleValidationErrors,
];

// Forgot Password Validation
const forgotPasswordValidation = [
  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),

  handleValidationErrors,
];

// Reset Password Validation
const resetPasswordValidation = [
  body("token")
    .isString()
    .withMessage("Reset token is required")
    .notEmpty()
    .withMessage("Reset token is required"),

  body("new_password")
    .isString()
    .withMessage("New password must be a string")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&+])[A-Za-z\d@$!%*?&+]/
    )
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&+)"
    ),

  handleValidationErrors,
];

// Change Password Validation
const changePasswordValidation = [
  body("current_password")
    .isString()
    .withMessage("Current password must be a string")
    .notEmpty()
    .withMessage("Current password is required"),

  body("new_password")
    .isString()
    .withMessage("New password must be a string")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long")
    .custom((value, { req }) => {
      if (value === req.body.current_password) {
        throw new Error("New password must be different from current password");
      }
      return true;
    }),

  handleValidationErrors,
];

// Verify Reset Token Validation
const verifyResetTokenValidation = [
  body("token")
    .isString()
    .withMessage("Reset token is required")
    .notEmpty()
    .withMessage("Reset token is required"),

  handleValidationErrors,
];

// Book Validation
const bookValidation = [
  body("title")
    .isString()
    .withMessage("Title must be a string")
    .trim()
    .notEmpty()
    .withMessage("Title is required"),

  body("author")
    .isString()
    .withMessage("Author must be a string")
    .trim()
    .notEmpty()
    .withMessage("Author is required"),

  body("isbn")
    .isString()
    .withMessage("ISBN must be a string")
    .trim()
    .notEmpty()
    .withMessage("ISBN is required")
    .custom(async (value) => {
      const existingBook = await Book.findOne({ isbn: value });
      if (existingBook) {
        throw new Error("ISBN already exists");
      }
      return true;
    }),

  body("category")
    .isString()
    .withMessage("Category must be a string")
    .trim()
    .notEmpty()
    .withMessage("Category is required"),

  body("total_copies")
    .isInt({ min: 1 })
    .withMessage("Total copies must be at least 1"),

  handleValidationErrors,
];

// Borrow Book Validation
const borrowBookValidation = [
  body("book_id").isMongoId().withMessage("Valid book ID is required"),

  body("user_id").isMongoId().withMessage("Valid user ID is required"),

  body("due_date")
    .optional()
    .isISO8601()
    .withMessage("Valid due date is required")
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("Due date must be in the future");
      }
      return true;
    }),

  handleValidationErrors,
];

// Return Book Validation
const returnBookValidation = [
  body("transaction_id")
    .isMongoId()
    .withMessage("Valid transaction ID is required"),

  handleValidationErrors,
];

// User Update Validation
const userUpdateValidation = [
  body("email")
    .optional()
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail()
    .custom(async (value, { req }) => {
      const existingUser = await User.findOne({
        email: value.toLowerCase(),
        _id: { $ne: req.params.id },
      });
      if (existingUser) {
        throw new Error("Email already exists");
      }
      return true;
    }),

  body("phone")
    .optional()
    .isString()
    .withMessage("Phone must be a string")
    .trim(),

  body("id_expiration")
    .optional()
    .isISO8601()
    .withMessage("Valid expiration date is required")
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("Expiration date must be in the future");
      }
      return true;
    }),

  handleValidationErrors,
];

module.exports = {
  requireActiveUser,
  requireActiveOnly,
  requireVerifiedOnly,

  registrationValidation,
  loginValidation,
  verifyEmailOtpValidation,
  resendOtpValidation,
  verifyLoginOtpValidation,
  qrValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  verifyResetTokenValidation,
  bookValidation,
  borrowBookValidation,
  returnBookValidation,
  userUpdateValidation,
  handleValidationErrors,
};
