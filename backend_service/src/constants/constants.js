// backend_service/src/constants/messages.js - Error and success messages

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

// Auth messages
const AUTH = {
  INVALID_CREDENTIALS: "Invalid matric number or password",
  ID_EXPIRED: "Student ID has expired",
  ACCOUNT_DEACTIVATED: "Account is deactivated",
  REGISTRATION_SUCCESS: "User registered successfully",
  LOGIN_SUCCESS: "Login successful",
  QR_VERIFICATION_SUCCESS: "QR code verified successfully",
  QR_INVALID: "Invalid QR code format",
  TOKEN_REQUIRED: "Access denied. No token provided.",
  TOKEN_INVALID: "Token is not valid.",
};

//Book messages
const BOOK = {
  NOT_FOUND: "Book not found",
  ADD_SUCCESS: "Book added successfully",
  UPDATE_SUCCESS: "Book updated successfully",
  DELETE_SUCCESS: "Book deleted successfully",
  NO_COPIES: "No copies available for borrowing",
  ALREADY_BORROWED: "User already has this book borrowed",
  BORROW_SUCCESS: "Book borrowed successfully",
  RETURN_SUCCESS: "Book returned successfully",
  ALREADY_RETURNED: "Book already returned",
  ISBN_EXISTS: "ISBN already exists",
};

// Validation messages
const VALIDATION = {
  FAILED: "Validation failed",
  MATRIC_REQUIRED: "Matric number is required",
  PASSWORD_LENGTH: "Password must be at least 6 characters long",
  EMAIL_REQUIRED: "Valid email is required",
  NAME_REQUIRED: "Full name is required",
  FACULTY_REQUIRED: "Faculty is required",
  DEPARTMENT_REQUIRED: "Department is required",
  ID_EXPIRATION_REQUIRED: "ID expiration date is required",
  TITLE_REQUIRED: "Book title is required",
  AUTHOR_REQUIRED: "Author is required",
  ISBN_REQUIRED: "ISBN is required",
  CATEGORY_REQUIRED: "Category is required",
  COPIES_REQUIRED: "Total copies must be at least 1",
};

const ERROR_MESSAGES = {
  // Authentication messages
  INVALID_CREDENTIALS: "Invalid matric number or password",
  ID_EXPIRED: "Student ID has expired",
  ACCOUNT_DEACTIVATED: "Account is deactivated",
  REGISTRATION_SUCCESS: "User registered successfully",
  LOGIN_SUCCESS: "Login successful",
  QR_VERIFICATION_SUCCESS: "QR code verified successfully",
  QR_INVALID: "Invalid QR code format",
  TOKEN_REQUIRED: "Access denied. No token provided.",
  TOKEN_INVALID: "Token is not valid.",

  // User messages
  USER_NOT_FOUND: "User not found",
  USER_UPDATE_SUCCESS: "User updated successfully",
  ACCESS_DENIED: "Access denied",
  DUPLICATE_MATRIC: "Matric number already exists",
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

  // Transaction messages
  TRANSACTION_NOT_FOUND: "Transaction not found",

  // Validation messages
  VALIDATION_ERROR: "Validation failed",

  // General messages
  INTERNAL_SERVER_ERROR: "Internal server error",
};

module.exports = {
  STATUS,
  HEALTH_STATUS,
  ERROR_MESSAGES,
  AUTH,
  VALIDATION,
  BOOK,
};
