// backend_service/src/constants/messages.js

// Server Health
const HEALTH_STATUS = {
  UP: "UP",
  DOWN: "DOWN",
};

// Status messagesw
const STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
  FAILED: "failed",
  SUCCESS: "success",
  ERROR: "error",
  COMPLETED: "completed",
  PROCESSING: "processing",
  CANCELLED: "cancelled",
  REJECTED: "rejected",
};

const ERROR_MESSAGES = {
  // Authentication messages
  INVALID_CREDENTIALS: "Invalid identification code or password",
  ID_EXPIRED: "ID has expired",
  ACCOUNT_DEACTIVATED: "Account is deactivated",
  REGISTRATION_SUCCESS: "User registered successfully",
  LOGIN_SUCCESS: "Login successful",
  QR_VERIFICATION_SUCCESS: "QR code verified successfully",
  QR_INVALID: "Invalid QR code format",
  TOKEN_REQUIRED: "Access denied. No token provided.",
  TOKEN_INVALID: "Token is not valid.",
  UNAUTHORIZED: "Unauthorized access",

  // User messages
  USER_NOT_FOUND: "User not found",
  USER_UPDATE_SUCCESS: "User updated successfully",
  ACCESS_DENIED: "Access denied",
  DUPLICATE_IDENTIFICATION: "Identification code already exists",
  DUPLICATE_EMAIL: "Email already exists",
  DUPLICATE_ENTRY: "Duplicate entry found",

  // Book messages
  BOOK_NOT_FOUND: "Book not found",
  BOOK_ADD_SUCCESS: "Book added successfully",
  BOOK_UPDATE_SUCCESS: "Book updated successfully",
  BOOK_DELETE_SUCCESS: "Book deleted successfully",
  NO_COPIES_AVAILABLE: "No copies available for borrowing",
  ALREADY_BORROWED: "User already has this book borrowed",
  BORROW_SUCCESS: "Book borrowed successfully",
  RETURN_SUCCESS: "Book returned successfully",
  ALREADY_RETURNED: "Book already returned",
  DUPLICATE_ISBN: "ISBN already exists",
  OUTSTANDING_FINES: "User has outstanding fines. Cannot borrow books.",
  ID_EXPIRED_BORROW: "Student ID has expired. Cannot borrow books.",
  BOOK_DELETE_SUCCESS: "Book deleted successfully",
  BOOK_PERMANENT_DELETE_SUCCESS: "Book permanently deleted successfully",
  BOOK_HAS_ACTIVE_BORROWS: "Cannot delete book with active borrows",
  BORROW_LIMIT_REACHED: "Maximum borrow limit reached",
  ID_EXPIRED_BORROW: "User ID has expired, cannot borrow books",
  OUTSTANDING_FINES: "User has outstanding fines that must be paid",
  GRACE_PERIOD_ACTIVE: "Book returned during grace period, no fine applied",

  // Transaction messages
  TRANSACTION_NOT_FOUND: "Transaction not found",

  // Fine Management Messages
  FINE_PAYMENT_SUCCESS: "Fine payment processed successfully",
  FINE_WAIVED_SUCCESS: "Fines waived successfully",
  NO_OUTSTANDING_FINES: "No outstanding fines found",
  CANNOT_WAIVE_FINE:
    "Cannot waive fine - fine may already be processed or insufficient permissions",

  // Payment Specific Errors
  INSUFFICIENT_PAYMENT: "Payment amount is insufficient for the selected fines",
  OVERPAYMENT_NOT_ALLOWED: "Payment amount cannot exceed outstanding fines",
  INVALID_PAYMENT_AMOUNT: "Payment amount must be greater than zero",
  PAYMENT_PROCESSING_ERROR: "Error processing payment",

  // Fine Waiver Errors
  WAIVER_REASON_REQUIRED: "Valid reason required for fine waiver",
  WAIVER_AMOUNT_EXCEEDS_FINES: "Waiver amount cannot exceed outstanding fines",
  WAIVER_NOT_AUTHORIZED: "Not authorized to waive fines",
  WAIVER_LIMIT_EXCEEDED: "Waiver limit exceeded for this user",

  // Validation messages
  VALIDATION_ERROR: "Validation failed",

  // General messages
  INTERNAL_SERVER_ERROR: "Internal server error",
};

// Fine Configuration Constants
const FINE_CONFIG = {
  RATE_PER_DAY: 5,
  MAX_FINE: 50,
  GRACE_PERIOD_DAYS: 3,
  DAILY_CAP: 10,
  DAMAGE_FINES: {
    excellent: 0,
    good: 0,
    fair: 5,
    poor: 15,
    damaged: 30,
    lost: 50,
  },
  WAIVER_LIMIT_PER_MONTH: 3, // Maximum waivers per user per month
  MAX_BULK_OPERATIONS: 10, // Maximum items for bulk operations
};

module.exports = {
  STATUS,
  HEALTH_STATUS,
  ERROR_MESSAGES,
  FINE_CONFIG,
};
